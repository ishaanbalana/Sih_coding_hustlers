# CRAFTORA Raw TCP Socket HTTP Server (Bypasses Http.sys & PID 4)
# Serves C:\crafto_sih on http://localhost:8085/

$port = 8085
$root = "C:\crafto_sih"

$endpoint = New-Object System.Net.IPEndPoint([System.Net.IPAddress]::Loopback, $port)
$tcpListener = New-Object System.Net.Sockets.TcpListener($endpoint)

try {
    $tcpListener.Start()
    Write-Host "================================================================="
    Write-Host " 🚀 CRAFTORA TCP Server active on http://localhost:${port}/"
    Write-Host "  - Localhost URL: http://localhost:${port}/"
    Write-Host "  - IP URL:        http://127.0.0.1:${port}/"
    Write-Host "================================================================="
} catch {
    Write-Error "Failed to start TcpListener on port ${port}: $_"
    exit 1
}

while ($tcpListener.Server.IsBound) {
    try {
        $client = $tcpListener.AcceptTcpClient()
        $stream = $client.GetStream()
        $reader = New-Object System.IO.StreamReader($stream)
        
        $requestLine = $reader.ReadLine()
        if (-not $requestLine) {
            $client.Close()
            continue
        }

        # Parse request path (e.g. GET /index.html HTTP/1.1)
        $parts = $requestLine.Split(' ')
        $urlPath = "/index.html"
        if ($parts.Length -ge 2) {
            $urlPath = [System.Uri]::UnescapeDataString($parts[1])
        }
        if ($urlPath -eq "/") { $urlPath = "/index.html" }

        # Strip query string if any
        if ($urlPath.Contains('?')) {
            $urlPath = $urlPath.Substring(0, $urlPath.IndexOf('?'))
        }

        $filePath = [System.IO.Path]::Combine($root, $urlPath.TrimStart('/'))

        if (Test-Path $filePath -PathType Leaf) {
            $bytes = [System.IO.File]::ReadAllBytes($filePath)
            $ext = [System.IO.Path]::GetExtension($filePath).ToLower()

            $contentType = switch ($ext) {
                ".html" { "text/html; charset=utf-8" }
                ".js"   { "application/javascript; charset=utf-8" }
                ".css"  { "text/css; charset=utf-8" }
                ".png"  { "image/png" }
                ".jpg"  { "image/jpeg" }
                ".svg"  { "image/svg+xml" }
                ".json" { "application/json; charset=utf-8" }
                default { "application/octet-stream" }
            }

            $header = "HTTP/1.1 200 OK`r`n" +
                      "Content-Type: $contentType`r`n" +
                      "Content-Length: $($bytes.Length)`r`n" +
                      "Access-Control-Allow-Origin: *`r`n" +
                      "Connection: close`r`n`r`n"

            $headerBytes = [System.Text.Encoding]::UTF8.GetBytes($header)
            $stream.Write($headerBytes, 0, $headerBytes.Length)
            $stream.Write($bytes, 0, $bytes.Length)
        } else {
            $notFound = "HTTP/1.1 404 Not Found`r`nContent-Type: text/plain`r`nContent-Length: 13`r`nConnection: close`r`n`r`n404 Not Found"
            $notFoundBytes = [System.Text.Encoding]::UTF8.GetBytes($notFound)
            $stream.Write($notFoundBytes, 0, $notFoundBytes.Length)
        }

        $stream.Flush()
        $client.Close()
    } catch {
        # Client disconnect handling
    }
}
