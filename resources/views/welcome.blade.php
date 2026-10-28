<!DOCTYPE html>
<html lang="en" class="dark">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <meta name="csrf-token" content="{{ csrf_token() }}">
    <title>Equiply • Campus Resource Nexus & P2P Gear Lending</title>
    <meta name="description" content="Hybrid campus borrowing and verified peer-to-peer equipment rental platform with real-time atomic reservation engine.">

    <!-- Fonts -->
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&family=Outfit:wght@400;500;600;700;800&display=swap" rel="stylesheet">

    @viteReactRefresh
    @vite(['resources/css/app.css', 'resources/js/app.jsx'])
</head>
<body class="bg-[#0B0F19] text-slate-100 antialiased min-h-screen selection:bg-indigo-500 selection:text-white font-['Inter',sans-serif]">
    <div id="root"></div>
</body>
</html>
