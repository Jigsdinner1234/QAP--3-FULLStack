$session = New-Object Microsoft.PowerShell.Commands.WebRequestSession
Invoke-WebRequest -Uri 'http://localhost:3000/register' -Method Post -Body @{username='tester'; email='tester@example.com'; password='password123'} -WebSession $session -UseBasicParsing -ErrorAction SilentlyContinue
Invoke-WebRequest -Uri 'http://localhost:3000/login' -Method Post -Body @{email='tester@example.com'; password='password123'} -WebSession $session -UseBasicParsing -ErrorAction SilentlyContinue
Invoke-WebRequest -Uri 'http://localhost:3000/recipes/create' -Method Post -Body @{name='Pancakes'; ingredients='Flour, Eggs, Milk'; instructions='Mix and cook'} -WebSession $session -UseBasicParsing -ErrorAction SilentlyContinue
$r = Invoke-WebRequest -Uri 'http://localhost:3000/recipes' -WebSession $session -UseBasicParsing -ErrorAction SilentlyContinue
$r.Content | Out-File -FilePath recipe_page.html -Encoding utf8
Write-Output 'DONE'
