$anon = "sb_publishable_rwjQGqAeYDS-IwRAi2tKBQ_5bWxbKrt"
$headers = @{
    "apikey" = $anon
}
try {
    $res = Invoke-RestMethod -Uri "https://vqoyvedycwyqjpfbuaxw.supabase.co/rest/v1/" -Headers $headers -Method Get
    $props = $res.definitions.psobject.properties.name
    Write-Host "Found definitions:" ($props -join ", ")
} catch {
    Write-Host "Error without Bearer:" $_.Exception.Message
}
