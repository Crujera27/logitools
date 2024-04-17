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

4. Import the database from database.sql
5. Rename .env.example to .env and fill the data.
6. Fill in the required data in the config/configuration.toml
7. Start the app
```bash
npm run start
```
