# Code by AkinoAlice@TyrantRey

Write-Host "Running installation script"
function CommandExists($cmd) {
    # return (Get-Command $cmd -ErrorAction SilentlyContinue) -ne $null
    return $null -ne (Get-Command $cmd -ErrorAction SilentlyContinue)
}
# Check docker installed 
if (CommandExists "docker.exe") {
    Write-Host "Docker is already installed."
}
else {
    Write-Host "This script is intended for Windows. Exiting."
    exit 1
}

# Install Milvus
function InstallMilvus() {
    try {
        $DockerVersion = docker --version
        Write-Host "Docker daemon is running"$DockerVersion
    }
    catch {
        Write-Host "Docker daemon is not running."
        exit 1
    }

    # check installed Milvus
    $milvusContainer = docker ps -a --filter "name=milvus-standalone" --format "{{.Names}}"
    if ($milvusContainer -eq "milvus-standalone") {
        Write-Host "Milvus installed"
    }
    else {
        Write-Host "Installing Milvus"
        Invoke-WebRequest https://raw.githubusercontent.com/milvus-io/milvus/refs/heads/master/scripts/standalone_embed.bat -OutFile ./standalone.bat
        
        ./standalone.bat start
    
        Remove-Item ./standalone.bat        
    }
}

InstallMilvus

Write-Host "Installation finished"
