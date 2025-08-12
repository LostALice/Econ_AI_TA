# Build.ps1
# Code by AkinoAlice@TyrantRey

$envVars = @{}
Get-Content ".env" | ForEach-Object {
    if ($_ -match "^\s*#") { return } # skip comments
    if ($_ -match "^\s*$") { return } # skip empty lines
    $parts = $_ -split '=', 2
    $name = $parts[0].Trim()
    $value = $parts[1].Trim()
    $envVars[$name] = $value
}

$NEXT_PUBLIC_API_URL = $envVars["NEXT_PUBLIC_API_URL"]

$remoteUrl = git config --get remote.origin.url
$repoName = [System.IO.Path]::GetFileNameWithoutExtension($remoteUrl) + "_frontend"

$imageName = $repoName.ToLower().Replace('-', '_')
$imageTag = Get-Date -Format "yyyyMMdd-HHmmss"

Write-Host "Building image: ${imageName}:$imageTag"
docker build `
    --build-arg NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL `
    -t "${imageName}:$imageTag" .

if ($LastExitCode -eq 0) {
    Write-Host "Docker image ${imageName}:$imageTag built successfully."
}
else {
    Write-Host "Docker image build failed."
    exit 1
}
