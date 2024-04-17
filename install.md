# Installation

#### Requirements:

- MariaDB 10 or higher
- Access to an IP with a port (For the web server)
- Node.JS v18 LTS & NPM

|Operating System|Version|Supported|Notes
|--|--|--|--|
| **Ubuntu** | 20.04 | ✅ |Documentation written assuming Ubuntu 20.04 as the base OS. Commands might be different depending on the OS |
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

###  Install Node.js

```bash
sudo apt install nodejs
```

3. Install NPM (Node Package Manager)

```bash
sudo apt install npm
```

- Install Node.js & NVM

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

5. **Verify Node.js Installation**:

```bash
node -v
```

6. **Set Default Node.js Version** (Optional):

```bash
nvm alias default 18
```

### Install git via APT

1. Update the package index to ensure you install the latest version of Git
```bash
sudo apt update
```
2. Install Git using the following command:
```bash
sudo apt install git
```
3. Verify that Git has been installed by checking its version
```bash
git --version
```

### Install MariaDB

1. Setup the MariaDB repo

*MariaDB repo setup script can be skipped on Ubuntu 22.04*
```bash
sudo curl -sS https://downloads.mariadb.com/MariaDB/mariadb_repo_setup | sudo bash
```

2. Update repositories list

```bash
sudo apt update
```

3. Install MariaDB Server
```bash
apt -y install mariadb-server
```

### Clone the latest source code


1. Copy the source from github using git

```bash
git clone https://github.com/Crujera27/logitools.git
```

2. Extract the source files

```bash
tar -xvf <filename>.tar.gz
```

3. Install the dependencies

```bash
npm install
```


# Database Configuration


1. Login into the MariaDB Server

```bash
mysql -u root -p
```

2. Create the DB user

**Remember to change 'mysupersecretpassword' below to be a unique password**
```sql
CREATE USER 'logitools'@'127.0.0.1' IDENTIFIED BY 'mysupersecretpassword';
```

3. Create the DB

```sql
CREATE DATABASE logitools;
```

4. Set permissions for the user
```sql
GRANT ALL PRIVILEGES ON logitools.* TO 'logitools'@'127.0.0.1' WITH GRANT OPTION;
```

5. Leave MariaDB CLI

```sql
exit
```


### Getting the app ready

1. Rename .env.example to .env and fill the data.
2. Fill in the required data in the config/configuration.toml
3. Start the app
```bash
npm run start
```


### Running the APP with [PM2](https://www.npmjs.com/package/pm2)


1. Install pm2 via npm

```bash
sudo npm install pm2 -g
```

2. Run the app with pm2


```bash
pm2 --name Logitools start npm -- start
```

