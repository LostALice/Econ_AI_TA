# Code by AkinoAlice@TyrantRey

if [[ "$(uname -s)" == "Linux" ]]; then
    echo "This system is running Linux."
else
    echo "This system is not running Linux."
fi

# Curl
if command -v curl &>/dev/null; then
    echo "curl is already installed."
else
    read -p "Curl not installed. Do you want to install Curl? (y/yes/n to confirm): " response
    response=$(echo "$response")

    if [[ "$response" == "y" || "$response" == "yes" ]]; then
        echo "Detected Debian-based system. Using apt."
        sudo apt update && sudo apt install -y curl
    else
        echo "Exited."
        exit 1
    fi

    if command -v curl &>/dev/null; then
        echo "curl was installed successfully."
    else
        echo "Failed to install curl. Please check your package manager or network connection."
        exit 1
    fi
fi

# Docker
if command -v docker &>/dev/null; then
    echo "Docker is installed."
    docker --version
else
    read -p "Docker not installed. Do you want to install Docker? (y/yes/n to confirm): " response
    response=$(echo "$response")

    if [[ "$response" == "y" || "$response" == "yes" ]]; then
        echo "Detected Debian-based system. Using apt."
        sudo apt-get update
        sudo apt install -y ca-certificates curl gnupg lsb-release
        sudo mkdir -p /etc/apt/keyrings
        curl -fsSL https://download.docker.com/linux/$(
            . /etc/os-release
            echo "$ID"
        )/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg
        echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/$(
            . /etc/os-release
            echo "$ID"
        ) $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list >/dev/null
        sudo apt-get update
        sudo apt install -y docker-ce docker-ce-cli container.io docker-buildx-plugin docker-compose-plugin
    else
        echo "Exited."
        exit 1
    fi

    sudo systemctl start docker
    sudo systemctl enable docker

    if command -v docker &>/dev/null; then
        echo "Docker was installed successfully."
        docker --version
    else
        echo "Failed to install Docker. Please check your package manager or network connection."
        exit 1
    fi
fi

# Milvus vectors database
read -p "Installing Milvus Vector Database? (y/yes/n to confirm)" response
response=$(echo "$response")

if [[ "$response" == "y" || "$response" == "yes" ]]; then
    curl -sfL https://raw.githubusercontent.com/milvus-io/milvus/master/scripts/standalone_embed.sh -o standalone_embed.sh
    chmod +x standalone_embed.sh
    sh standalone_embed.sh start
else
    echo "Exited."
    exit 1
fi

# Mysql Server
read -p "Installing MYSQL in Docker? (y/yes/n to confirm)" response
response=$(echo "$response")

if [[ "$response" == "y" || "$response" == "yes" ]]; then
    read -sp "Enter a MySQL root password: " MYSQL_ROOT_PASSWORD
    echo

    read -sp "Confirm the MySQL root password: " CONFIRM_PASSWORD
    echo

    if [[ "$MYSQL_ROOT_PASSWORD" != "$CONFIRM_PASSWORD" ]]; then
        echo "Passwords do not match. Exiting."
        exit 1
    fi

    read -sp "MYSQL port: " MYSQL_PORT
    echo

    echo "MYSQL_ROOT_PASSWORD=$MYSQL_ROOT_PASSWORD\n" >./Backend/.env
    echo "MYSQL_PORT=$MYSQL_PORT\n" >./Backend/.env

    docker run --name mysql -p $MYSQL_PORT:3306 -e MYSQL_ROOT_PASSWORD=$MYSQL_ROOT_PASSWORD -d mysql
else
    echo "Exited."
    exit 1
fi
