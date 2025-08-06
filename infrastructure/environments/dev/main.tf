terraform {
  required_version = ">= 1.0"
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

provider "aws" {
  region = var.aws_region
}

locals {
  name_prefix = "${var.project_name}-${var.environment}"

  common_tags = {
    Environment = var.environment
    Project     = var.project_name
    ManagedBy   = "terraform"
  }

  # Environment variables for API container
  api_environment_variables = {
    NODE_ENV     = var.environment
    PORT         = tostring(var.api_port)
    CORS_ORIGIN  = var.cors_origin
    DATABASE_URL = "postgresql://${var.db_username}:${var.db_password}@${module.database.db_instance_endpoint}/${var.database_name}"
  }

  # Environment variables for Worker container
  worker_environment_variables = {
    NODE_ENV       = var.environment
    PORT           = tostring(var.worker_port)
    DATABASE_URL   = "postgresql://${var.db_username}:${var.db_password}@${module.database.db_instance_endpoint}/${var.database_name}"
    REDIS_HOST     = module.redis.redis_endpoint
    REDIS_PORT     = "6379"
    REDIS_PASSWORD = var.redis_password
    REDIS_DB       = "0"
    OPENAI_API_KEY    = var.openai_api_key
    ANTHROPIC_API_KEY = var.anthropic_api_key
  }
}

# Networking Module
module "networking" {
  source = "../../modules/networking"

  name_prefix          = local.name_prefix
  vpc_cidr             = var.vpc_cidr
  public_subnet_count  = 2
  private_subnet_count = 2
  enable_nat_gateway   = true
  nat_gateway_count    = 1

  tags = local.common_tags
}

# Database Module
module "database" {
  source = "../../modules/database"

  name_prefix               = local.name_prefix
  vpc_id                    = module.networking.vpc_id
  subnet_ids                = module.networking.private_subnet_ids
  allowed_security_groups   = [module.api_app.security_group_id, module.worker_app.security_group_id]
  
  database_name = var.database_name
  username      = var.db_username
  password      = var.db_password
  
  instance_class = "db.t3.micro"  # Small instance for dev
  
  tags = local.common_tags
}

# Redis Module
module "redis" {
  source = "../../modules/redis"

  name_prefix             = local.name_prefix
  vpc_id                  = module.networking.vpc_id
  subnet_ids              = module.networking.private_subnet_ids
  allowed_security_groups = [module.api_app.security_group_id, module.worker_app.security_group_id]
  
  auth_token = var.redis_password
  node_type  = "cache.t3.micro"  # Small instance for dev
  
  tags = local.common_tags
}

# ECS Cluster
resource "aws_ecs_cluster" "main" {
  name = local.name_prefix

  setting {
    name  = "containerInsights"
    value = "enabled"
  }

  tags = local.common_tags
}

# Application Load Balancer
resource "aws_lb" "main" {
  name               = "${local.name_prefix}-alb"
  internal           = false
  load_balancer_type = "application"
  security_groups    = [aws_security_group.alb.id]
  subnets            = module.networking.public_subnet_ids

  enable_deletion_protection = false

  tags = local.common_tags
}

# ALB Security Group
resource "aws_security_group" "alb" {
  name_prefix = "${local.name_prefix}-alb-"
  vpc_id      = module.networking.vpc_id

  ingress {
    protocol    = "tcp"
    from_port   = 80
    to_port     = 80
    cidr_blocks = ["0.0.0.0/0"]
  }

  ingress {
    protocol    = "tcp"
    from_port   = 443
    to_port     = 443
    cidr_blocks = ["0.0.0.0/0"]
  }

  egress {
    protocol    = "-1"
    from_port   = 0
    to_port     = 0
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-alb-sg"
  })
}

# ALB Target Group for API
resource "aws_lb_target_group" "api" {
  name        = "${local.name_prefix}-api-tg"
  port        = var.api_port
  protocol    = "HTTP"
  vpc_id      = module.networking.vpc_id
  target_type = "ip"

  health_check {
    enabled             = true
    healthy_threshold   = 2
    interval            = 30
    matcher             = "200"
    path                = "/health"
    port                = "traffic-port"
    protocol            = "HTTP"
    timeout             = 5
    unhealthy_threshold = 2
  }

  tags = local.common_tags
}

# ALB Listener
resource "aws_lb_listener" "api" {
  load_balancer_arn = aws_lb.main.arn
  port              = "80"
  protocol          = "HTTP"

  default_action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.api.arn
  }
}

# API Application
module "api_app" {
  source = "../../modules/ecs-app"

  name_prefix    = local.name_prefix
  app_name       = "api"
  vpc_id         = module.networking.vpc_id
  subnet_ids     = module.networking.private_subnet_ids
  
  cluster_id              = aws_ecs_cluster.main.id
  container_image         = var.api_container_image
  container_port          = var.api_port
  desired_count           = var.api_desired_count
  
  target_group_arn        = aws_lb_target_group.api.arn
  
  environment_variables   = local.api_environment_variables
  
  tags = local.common_tags
}

# Worker Application
module "worker_app" {
  source = "../../modules/ecs-app"

  name_prefix    = local.name_prefix
  app_name       = "worker"
  vpc_id         = module.networking.vpc_id
  subnet_ids     = module.networking.private_subnet_ids
  
  cluster_id              = aws_ecs_cluster.main.id
  container_image         = var.worker_container_image
  container_port          = var.worker_port
  desired_count           = var.worker_desired_count
  
  # Worker doesn't need load balancer
  target_group_arn        = null
  
  environment_variables   = local.worker_environment_variables
  
  tags = local.common_tags
}