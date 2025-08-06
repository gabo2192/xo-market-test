# modules/ecs-app/variables.tf - Fixed Version

variable "name_prefix" {
  description = "Prefix for resource names"
  type        = string
}

variable "app_name" {
  description = "Name of the application"
  type        = string
}

variable "vpc_id" {
  description = "VPC ID"
  type        = string
}

variable "subnet_ids" {
  description = "List of subnet IDs for ECS service"
  type        = list(string)
}

variable "ecs_cluster_id" {
  description = "ECS cluster ID"
  type        = string
}

variable "container_image" {
  description = "Docker container image"
  type        = string
}

variable "container_port" {
  description = "Port that the container exposes (null for worker apps)"
  type        = number
  default     = null
}

variable "cpu" {
  description = "CPU units for the task"
  type        = number
  default     = 256
}

variable "memory" {
  description = "Memory for the task"
  type        = number
  default     = 512
}

variable "desired_count" {
  description = "Number of tasks to run"
  type        = number
  default     = 1
}

variable "environment_variables" {
  description = "Environment variables for the container"
  type        = map(string)
  default     = {}
}

variable "secrets" {
  description = "Secrets for the container (key = env var name, value = secret ARN)"
  type        = map(string)
  default     = {}
}

variable "alb_security_group_ids" {
  description = "List of ALB security group IDs (empty for worker apps)"
  type        = list(string)
  default     = []
}

variable "target_group_arn" {
  description = "ALB target group ARN (null for worker apps)"
  type        = string
  default     = null
}

variable "assign_public_ip" {
  description = "Assign public IP to tasks"
  type        = bool
  default     = false
}

variable "service_discovery_arn" {
  description = "Service discovery ARN"
  type        = string
  default     = null
}

variable "task_role_arn" {
  description = "IAM role ARN for the task"
  type        = string
  default     = null
}

variable "aws_region" {
  description = "AWS region"
  type        = string
}

variable "log_retention_in_days" {
  description = "CloudWatch log retention in days"
  type        = number
  default     = 30
}

variable "scan_on_push" {
  description = "Enable image scanning on push to ECR"
  type        = bool
  default     = true
}

variable "image_retention_count" {
  description = "Number of images to retain in ECR"
  type        = number
  default     = 10
}

variable "health_check" {
  description = "Health check configuration"
  type = object({
    command     = list(string)
    interval    = number
    timeout     = number
    retries     = number
    startPeriod = number
  })
  default = null
}

variable "tags" {
  description = "Tags to apply to all resources"
  type        = map(string)
  default     = {}
}