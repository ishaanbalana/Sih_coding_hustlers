# CRAFTORA Local Server Script - Multi-Host Loopback Support
$port = 8000
$root = "C:\crafto_sih"

$listener = New-Object System.Net.HttpListener

# Bind all standard loopback prefixes to prevent "400 Bad Request - Invalid Host Name"
$prefixes = @(
    "http://localhost:${port}/",
    "http://127.0.0.1:${port}/",
    "http://[::1]:${port}/"
)

foreach ($prefix in $prefixes) {
    try {
        $listener.Prefixes.Add($prefix)
    }
    catch {
        # Ignore prefix registration errors if already registered
    }
}

try {
    $listener.Start()
    Write-Host "CRAFTORA HTTP Server active on:"
    Write-Host "  - http://localhost:${port}/"
    Write-Host "  - http://127.0.0.1:${port}/"
}
catch {
    Write-Error "Failed to start HttpListener: $_"
    exit 1
}

while ($listener.IsListening) {
    try {
        $context = $listener.GetContext()
        $request = $context.Request
        $response = $context.Response

        $urlPath = [System.Uri]::UnescapeDataString($request.Url.LocalPath)
        if ($urlPath -eq "/") { $urlPath = "/index.html" }
        
        $filePath = [System.IO.Path]::Combine($root, $urlPath.TrimStart('/'))

        if (Test-Path $filePath -PathType Leaf) {
            $bytes = [System.IO.File]::ReadAllBytes($filePath)
            $ext = [System.IO.Path]::GetExtension($filePath).ToLower()
            
            switch ($ext) {
                ".html" { $response.ContentType = "text/html; charset=utf-8" }
                ".js" { $response.ContentType = "application/javascript; charset=utf-8" }
                ".css" { $response.ContentType = "text/css; charset=utf-8" }
                ".png" { $response.ContentType = "image/png" }
                ".jpg" { $response.ContentType = "image/jpeg" }
                ".svg" { $response.ContentType = "image/svg+xml" }
                ".json" { $response.ContentType = "application/json; charset=utf-8" }
                default { $response.ContentType = "application/octet-stream" }
            }

            $response.Headers.Add("Access-Control-Allow-Origin", "*")
            $response.ContentLength64 = $bytes.Length
            $response.OutputStream.Write($bytes, 0, $bytes.Length)
        }
        else {
            $response.StatusCode = 404
            $notFoundMsg = [System.Text.Encoding]::UTF8.GetBytes("404 Not Found: $urlPath")
            $response.OutputStream.Write($notFoundMsg, 0, $notFoundMsg.Length)
        }
        $response.OutputStream.Close()
    }
    catch {
        # Client connection handling
    }
}
