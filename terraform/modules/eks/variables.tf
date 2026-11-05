variable "project_name" {
  type = string
}

variable "environment" {
  type = string
}

variable "eks_cluster_name" {
  type = string
}

variable "vpc_id" {
  type = string
}

variable "subnet_ids" {
  type = list(string)
}

variable "cluster_role_arn" {
  type = string
}

variable "node_role_arn" {
  type = string
}

variable "instance_types" {
  type = list(string)
}

