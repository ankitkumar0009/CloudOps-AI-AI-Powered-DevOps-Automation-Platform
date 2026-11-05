import sys
import os

# Add backend and ai-agent to sys.path
root_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
backend_dir = os.path.join(root_dir, "backend")
ai_agent_dir = os.path.join(root_dir, "ai-agent")

for d in [root_dir, backend_dir, ai_agent_dir]:
    if d not in sys.path:
        sys.path.insert(0, d)

