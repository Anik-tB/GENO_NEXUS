# GenoNexus: Project Setup Guidelines

Follow these step-by-step instructions to set up and run the GenoNexus project on a new laptop or machine.

## 1. Prerequisites
Before you begin, ensure you have the following software installed on the new machine:
- **Node.js**: [Download & Install](https://nodejs.org/) (Version 18 or higher is recommended). This will also install `npm`.
- **Git**: [Download & Install](https://git-scm.com/) (For version control and cloning the repository).
- **PostgreSQL 18**: [Download & Install](https://www.postgresql.org/download/) (Required for the backend database). Make sure to remember the password you set during installation.

## 2. Clone the Repository
Open your terminal (Command Prompt, PowerShell, or Git Bash) and run:
```bash
git clone <your-repository-url-here>
cd GENO_NEXUS
```
*(Note: If you are just transferring files via a USB drive or cloud storage instead of Git, simply copy the `GENO_NEXUS` folder and open a terminal inside that folder).*

## 3. Environment Variables setup
The project requires environment variables to connect to the database and manage authentication.
1. In the root of your project, find the `.env.example` file.
2. Duplicate this file and rename the copy to `.env.local`.
3. Open `.env.local` and ensure `DATABASE_URL` is correct. You will need to update it with your actual PostgreSQL password. Example: `postgresql://postgres:YOUR_PASSWORD@localhost:5432/genonexus`

## 4. Setup the Database
Since you are using a local installation of PostgreSQL 18, follow these steps to prepare your database:
1. Open your terminal or Command Prompt.
2. Connect to PostgreSQL and create the database:
   ```bash
   psql -U postgres -c "CREATE DATABASE genonexus;"
   ```
3. Import the required schema to create your tables:
   ```bash
   psql -U postgres -d genonexus -f database/schema.sql
   ```

## 5. Install Dependencies
Now that the backend database is running, install the frontend Next.js/React dependencies by running:
```bash
npm install
```

## 6. Run the Application
Finally, start the local development server:
```bash
npm run dev
```

## 7. View the Application
Open your web browser and navigate to:
**[http://localhost:3000](http://localhost:3000)**

You should now see the GenoNexus application running locally!

---

### Troubleshooting
- **Database Connection Error**: Ensure your `DATABASE_URL` in `.env.local` contains the correct password you set during the PostgreSQL 18 installation.
- **psql is not recognized**: If Windows/Mac says `psql` is not recognized, you need to add your PostgreSQL `bin` folder (e.g., `C:\Program Files\PostgreSQL\18\bin`) to your system's PATH environment variables.
- **Port 3000 is already in use**: The terminal will likely ask if you want to use another port (like 3001). Type `y` to accept.
