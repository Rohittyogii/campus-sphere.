# Read the doc: https://huggingface.co/docs/hub/spaces-sdks-docker
# you will also find guides on how best to write your Dockerfile

FROM python:3.11-slim

# Set working directory
WORKDIR /app

# Install system dependencies (required for FAISS and compiling Python packages)
RUN apt-get update && apt-get install -y \
    build-essential \
    libpq-dev \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements first to leverage Docker cache
COPY requirements.txt .
RUN pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir -r requirements.txt

# Set up a new user named "user" with user ID 1000
# (Hugging Face Spaces requires this for security)
RUN useradd -m -u 1000 user
USER user
ENV HOME=/home/user \
    PATH=/home/user/.local/bin:$PATH

# Change the working directory to the user's home directory
WORKDIR $HOME/app

# Copy the rest of the application code
# Ensure the user has ownership
COPY --chown=user . $HOME/app/

# Hugging Face Spaces routes traffic to port 7860
ENV PORT=7860
EXPOSE 7860

# Run the FastAPI application
CMD ["python", "-m", "backend.main"]
