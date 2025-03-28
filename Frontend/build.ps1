# Build.ps1
# Code by AkinoAlice@TyrantRey

$remoteUrl = git config --get remote.origin.url
$repoName = [System.IO.Path]::GetFileNameWithoutExtension($remoteUrl) + "_frontend"

$imageName = $repoName.ToLower().Replace('-', '_')
$imageTag = Get-Date -Format "yyyyMMdd-HHmmss"

Write-Host "Building image: ${imageName}:$imageTag"
docker build -t "${imageName}:$imageTag" .

if ($LASTEXITCODE -eq 0) {
    Write-Host "Docker image ${imageName}:$imageTag built successfully."
}
else {
    Write-Host "Docker image build failed."
    exit 1
}
