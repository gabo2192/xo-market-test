variable "project_name" {
  description = "Name of the project"
  type        = string
  default     = "xo-market"
}

variable "environment" {
  description = "Environment name"
  type        = string
  default     = "dev"
}

variable "aws_region" {
  description = "AWS region"
  type        = string
  default     = "us-east-1"
}

# Networking
variable "vpc_cidr" {
  description = "CIDR block for VPC"
  type        = string
  default     = "10.0.0.0/16"
}

# Database
variable "database_name" {
  description = "Name of the database"
  type        = string
  default     = "xo_market_db"
}

variable "db_username" {
  description = "Database username"
  type        = string
  default     = "xo_market_user"
}

variable "db_password" {
  description = "Database password"
  type        = string
  sensitive   = true
}

# Redis
variable "redis_password" {
  description = "Redis password"
  type        = string
  sensitive   = true
}

# Container Images
variable "api_container_image" {
  description = "API container image"
  type        = string
}

variable "worker_container_image" {
  description = "Worker container image"
  type        = string
}

# Application Configuration
variable "api_port" {
  description = "Port that the API container exposes"
  type        = number
  default     = 3001
}

variable "worker_port" {
  description = "Port that the worker container exposes"
  type        = number
  default     = 3002
}

variable "api_desired_count" {
  description = "Number of API tasks to run"
  type        = number
  default     = 1
}

variable "worker_desired_count" {
  description = "Number of worker tasks to run"
  type        = number
  default     = 1
}

# CORS
variable "cors_origin" {
  description = "CORS origin for the API"
  type        = string
  default     = "http://localhost:3000"
}

# AI API Keys (optional)
variable "openai_api_key" {
  description = "OpenAI API key for AI evaluation"
  type        = string
  default     = ""
  sensitive   = true
}

variable "anthropic_api_key" {
  description = "Anthropic API key for AI evaluation"
  type        = string
  default     = ""
  sensitive   = true
}