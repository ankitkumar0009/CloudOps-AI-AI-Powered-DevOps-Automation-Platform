# Contributing to CloudOps AI 2.0

Thank you for your interest in contributing to **CloudOps AI 2.0**! As an enterprise-grade DevOps platform, we enforce rigorous testing, code quality, and security standards on all contributions.

---

## 1. Development Environment Setup

1. Fork and clone the repository:
   ```bash
   git clone https://github.com/<your-username>/PROJECT-AI-POWERED-DEVOPS-AUTOMATION-PLATFORM.git
   cd "PROJECT-AI-POWERED-DEVOPS-AUTOMATION-PLATFORM"
   ```
2. Copy sample environment file:
   ```bash
   cp .env.example .env
   ```
3. Install frontend dependencies:
   ```bash
   cd frontend
   npm install
   ```
4. Verify backend automated test suite:
   ```bash
   python -m pytest tests/ -v
   ```

---

## 2. Conventional Commit Standards

Commit messages must follow the [Conventional Commits](https://www.conventionalcommits.org/) specification:

- `feat(devops)`: New feature (e.g. `feat(k8s): implement canary deployment weighted router`)
- `fix(ai)`: Bug fix (e.g. `fix(agent): parse exit code 137 correctly in oom diagnostic`)
- `sec(gitleaks)`: Security fix or policy enhancement (e.g. `sec(masking): update regex pattern for gitlab pat`)
- `perf(docker)`: Performance improvement (e.g. `perf(docker): optimize multi-stage builder layer caching`)
- `test(api)`: Adding or updating automated tests (e.g. `test(api): add blue-green switch verification test`)
- `docs(readme)`: Documentation update (e.g. `docs(arch): update high-level architecture diagram`)

---

## 3. Pull Request Guidelines

1. **Branch Naming:** Create a feature branch matching your task:
   - `feature/blue-green-router`
   - `bugfix/oom-recovery-action`
   - `security/trivy-cve-gate`
2. **Automated Testing:** All 42 automated tests in `tests/` must pass with zero failures:
   ```bash
   python -m pytest tests/ -v
   ```
3. **Frontend Compilation:** TypeScript and Vite bundle must build cleanly:
   ```bash
   cd frontend && npm run build
   ```
4. **Zero Secret Leaks:** Verify that no credentials, tokens, or API keys are committed in code or git history.
5. **Human-in-the-Loop Guardrails:** Never introduce raw unconstrained shell execution (`subprocess.call(raw_cmd, shell=True)`). All infrastructure operations must route through allowlisted methods in `backend/app/utils/security.py`.

---

## 4. Code Review & Quality Gates

Every pull request triggers the automated DevSecOps validation pipeline:
- **SonarQube Quality Gate:** Minimum Grade A.
- **Trivy Container Scan:** Zero Critical or High vulnerabilities.
- **Checkov IaC Scan:** 100% compliance on high-severity security rules.
- **Review Requirement:** Approval from at least one SRE / DevOps lead.

