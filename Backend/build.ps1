# Build.ps1
# Code by AkinoAlice@TyrantRey

Write-Host "Installing require service"


function StartMilvus() {
    Write-Host "Installing Milvus"

    $milvusIsRunning = docker ps --filter "name=milvus-standalone" --format "{{.Names}}"
    if ($null -eq $milvusIsRunning) {
        Invoke-WebRequest https://raw.githubusercontent.com/milvus-io/milvus/refs/heads/master/scripts/standalone_embed.bat -OutFile ./standalone.bat
        ./standalone.bat start
        Remove-Item ./standalone.bat
        Write-Host "Milvus ready"
        return 
    }
}

StartMilvus

$remoteUrl = git config --get remote.origin.url
$repoName = [System.IO.Path]::GetFileNameWithoutExtension($remoteUrl) + "_backend"

$imageName = $repoName.ToLower().Replace('-', '_')
$imageTag = Get-Date -Format "yyyyMMdd-HHmmss"

Write-Host "Building image: ${imageName}:$imageTag"
docker build -t "${imageName}:$imageTag" .

if ($LastExitCode -eq 0) {
    Write-Host "Docker image ${imageName}:$imageTag built successfully."
}
else {
    Write-Host "Docker image build failed."
    exit 1
}