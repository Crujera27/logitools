# Installation

#### Requirements:

- MariaDB 10 or higher
- Access to an IP with a port (For the web server)
- Node.js v18 LTS & NPM

|Operating System|Version|Supported|Notes|
|--|--|--|--|
| **Ubuntu** | 20.04 | ✅ |Documentation written assuming Ubuntu 20.04 as the base OS. Commands might be different depending on the OS.|
|  | 22.04 | ✅ | |
| **CentOS** |  |✅ | |
|| 7 |✅ | |
|| 8 |✅ | |
| **Debian** | 11 | ✅| |
|| 12 |✅ | |
| **Microsoft Windows** | 10 | ✅| |
|| 11 |✅ | |


## Setting up the production environment:

### Install Node.js via APT

1. Update the package index:

```bash
sudo apt update
```

2. Install Node.js and NPM:

```bash
sudo apt install nodejs npm
```

### Alternatively, Install Node.js & NVM

1. **Install NVM:**

```bash
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash
```

2. **Execute NVM install script:**

```bash
source ~/.bashrc
```

3. **Verify NVM Installation:**

```bash
nvm --version
```

4. **Install Node.js v18 LTS:**

```bash
nvm install 18
```

5. **Verify Node.js Installation:**

```bash
node -v
```

6. **Set Default Node.js Version** (Optional):

```bash
nvm alias default 18
```

### Install Git via APT

1. Update the package index to ensure you install the latest version of Git:

```bash
sudo apt update
```

2. Install Git:

```bash
sudo apt install git
```

3. Verify that Git has been installed:

```bash
git --version
```

### Install MariaDB

1. Setup the MariaDB repo

*MariaDB repo setup script can be skipped on Ubuntu 22.04*

```bash
sudo curl -sS https://downloads.mariadb.com/MariaDB/mariadb_repo_setup | sudo bash
```

2. Update repositories list:

```bash
sudo apt update
```

3. Install MariaDB Server:

```bash
sudo apt install mariadb-server
```

### Clone the Latest Source Code

1. Copy the source from GitHub using Git:

```bash
git clone https://github.com/Crujera27/logitools.git
```

2. Extract the source files (if applicable):

```bash
tar -xvf <filename>.tar.gz
```

3. Install the dependencies:

```bash
npm install
```

# Database Configuration

1. Login into the MariaDB Server:

```bash
mysql -u root -p
```

2. Create the DB user:

**Remember to change 'mysupersecretpassword' below to be a unique password**

```sql
CREATE USER 'logitools'@'127.0.0.1' IDENTIFIED BY 'mysupersecretpassword';
```

3. Create the DB:

```sql
CREATE DATABASE logitools;
```

4. Set permissions for the user:

```sql
GRANT ALL PRIVILEGES ON logitools.* TO 'logitools'@'127.0.0.1' WITH GRANT OPTION;
```

5. Leave MariaDB CLI:

```sql
exit
```

### Getting the app ready

1. Rename .env.example to .env and fill in the data.
2. Fill in the required data in the `config/configuration.toml`.
3. Start the app:

```bash
npm run start
```

### Running the APP with [PM2](https://www.npmjs.com/package/pm2)

1. Install pm2 via npm:

```bash
sudo npm install pm2 -g
```

2. Run the app with pm2:

```bash
pm2 --name Logitools start npm -- start
```

# Development Environment Setup

## Prerequisites

Before setting up the development environment, ensure that you have the following prerequisites installed:

- MariaDB 10 or higher
- Access to an IP with a port (for the web server)
- Node.js v18 LTS & NPM
- Git

## Setting up the Development Environment

### 1. Clone the Repository

1. Clone the repository from GitHub using Git:

```bash
git clone https://github.com/Crujera27/logitools.git
```

2. Navigate into the project directory:

```bash
cd logitools
```

### 2. Install Dependencies

1. Install Node.js and NPM if not already installed:

```bash
sudo apt update
sudo apt install nodejs npm
```

2. Alternatively, if you prefer using Node Version Manager (NVM), follow the instructions provided in the [Installation](#installation) section to install NVM and Node.js v18 LTS.

3. Install project dependencies:

```bash
npm install
```

### 3. Database Configuration

1. Install and configure MariaDB as per the instructions provided in the [Installation](#database-configuration) section. Ensure that you have created the necessary database and user for the application.

### 4. Configuration

1. Rename the `.env.example` file to `.env`:

```bash
mv .env.example .env
```

2. Fill in the required data in the `.env` file, including database connection details and any other environment variables required for your development environment.

3. Optionally, modify the `config/configuration.toml` file if any specific configurations are needed for your development environment.

### 5. Run the Application

1. Start the application with nodemon:

```bash
npm run dev
```

2. Access the application via the configured port and IP address.

### 6. Development Workflow

- Make changes to the source code as required for your development.
- Use version control with Git to track your changes and collaborate with other developers if needed.
- Test your changes locally by running the application and verifying its functionality.
- Repeat the development, testing, and debugging process as necessary until the desired features or fixes are implemented.

### Conclusion

You have now successfully set up the development environment for the Logitools application. You can begin developing new features or fixing issues as needed. Remember to follow best practices and maintain clear documentation of your changes.
```

This documentation provides a step-by-step guide for setting up the development environment based on the provided instructions, ensuring clarity and completeness.