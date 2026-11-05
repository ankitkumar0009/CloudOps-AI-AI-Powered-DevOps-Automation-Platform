output "vpc_id" {
  description = "The ID of the provisioned VPC"
  value       = module.vpc.vpc_id
}

output "eks_cluster_endpoint" {
  description = "Endpoint for EKS control plane API"
  value       = module.eks.cluster_endpoint
}

output "eks_cluster_name" {
  description = "The name of the Kubernetes cluster"
  value       = module.eks.cluster_name
}

output "ecr_repository_url" {
  description = "The URL of the created Amazon ECR repository"
  value       = module.ecr.repository_url
}

output "github_oidc_role_arn" {
  description = "IAM Role ARN for GitHub Actions OIDC"
  value       = module.iam.github_oidc_role_arn
}
