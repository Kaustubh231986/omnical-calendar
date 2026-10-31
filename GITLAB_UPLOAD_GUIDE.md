# Guide: Uploading OmniCal Project to GitLab & GitHub

This guide walks you step-by-step through creating a repository on **GitLab** (or **GitHub**) and uploading this codebase from your terminal or machine.

---

## Part 1: Uploading to GitLab (Step-by-Step)

### Step 1: Create a New Project on GitLab
1. Sign in to your [GitLab account](https://gitlab.com/) (or your self-hosted GitLab instance).
2. In the top-left or dashboard, click the **"+"** button and select **"New project/repository"**.
3. Choose **"Create blank project"**.
4. Set:
   - **Project name**: `omnical-master-calendar` (or your preferred name)
   - **Project URL / Namespace**: select your user account or group
   - **Visibility Level**: `Private` (recommended for company data) or `Public`
   - **IMPORTANT**: **Uncheck** "Initialize repository with a README" (since this project already has a complete codebase and README).
5. Click **"Create project"**.
6. Copy your project repository URL:
   - HTTPS: `https://gitlab.com/<your-username>/<your-project>.git`
   - SSH: `git@gitlab.com:<your-username>/<your-project>.git`

---

### Step 2: Push from Terminal

The repository in this project is already initialized with `git` and has all files committed on the `main` branch.

Run the following commands in the project root directory:

```bash
# 1. Ensure you are on the main branch
git branch -M main

# 2. Add your GitLab repository as the remote origin
# (Replace with your actual GitLab URL)
git remote add origin https://gitlab.com/<your-username>/<your-project>.git

# If a remote already exists, you can update it:
# git remote set-url origin https://gitlab.com/<your-username>/<your-project>.git

# 3. Push your code to GitLab
git push -u origin main
```

---

### Step 3: GitLab Authentication (HTTPS vs SSH)

#### Option A: HTTPS with a Personal Access Token (PAT) - Recommended
GitLab no longer accepts your regular account password for terminal `git push`. Use a Personal Access Token:
1. In GitLab, click your avatar (top-left or top-right) > **Edit profile** > **Access Tokens** (or visit `https://gitlab.com/-/user_settings/personal_access_tokens`).
2. Click **"Add new token"**.
3. Name: `omnical-push-token`
4. Expiration date: Select desired duration.
5. Scopes: Check **`read_repository`** and **`write_repository`**.
6. Click **"Create personal access token"** and copy the generated token (`glpat-...`).
7. When running `git push -u origin main`:
   - **Username**: Your GitLab username
   - **Password**: Paste your Personal Access Token (`glpat-...`)

*Tip: To avoid entering the token repeatedly, you can embed it or cache credentials:*
```bash
git remote set-url origin https://<your-username>:<your-token>@gitlab.com/<your-username>/<your-project>.git
git push -u origin main
```

#### Option B: SSH Key (Cleanest, No Passwords)
1. Check if you have an SSH key:
   ```bash
   cat ~/.ssh/id_ed25519.pub || cat ~/.ssh/id_rsa.pub
   ```
2. If none exists, generate one:
   ```bash
   ssh-keygen -t ed25519 -C "email.kaustubh@gmail.com"
   ```
   (Press Enter for default path and optional passphrase)
3. Copy your public key:
   ```bash
   cat ~/.ssh/id_ed25519.pub
   ```
4. In GitLab: Go to **Preferences** > **SSH Keys** > **Add new key** > Paste the key and save.
5. Push using the SSH remote:
   ```bash
   git remote set-url origin git@gitlab.com:<your-username>/<your-project>.git
   git push -u origin main
   ```

---

## Part 2: If You Meant GitHub (Based on `https://github.com/projects`)

If your target is GitHub:
1. Go to [github.com/new](https://github.com/new).
2. Enter Repository name: `omnical-master-calendar`.
3. Leave "Add a README" unchecked.
4. Click **"Create repository"**.
5. Run in your terminal:
   ```bash
   git branch -M main
   git remote add origin https://github.com/<your-username>/<your-repo-name>.git
   git push -u origin main
   ```
6. When prompted for password, enter a GitHub **Personal Access Token (classic)** with `repo` permissions generated from GitHub Settings > Developer Settings > Personal access tokens.

---

## Part 3: Ongoing Workflow & Updates

Whenever you make future updates:
```bash
# Check modified files
git status

# Stage changes
git add .

# Commit with a message
git commit -m "Update calendar sync rules & company email gateways"

# Push to your remote
git push origin main
```

---

## Part 4: What is Committed & What is Protected (.gitignore)

The codebase includes an enterprise-ready `.gitignore`:
- `node_modules/` - Excluded (installed fresh with `npm install`)
- `dist/` - Excluded (built fresh with `npm run build`)
- `.env*` - Secrets excluded (`.env.production`, `.env.local`)
- `.env.example` - Included as a secure configuration template
