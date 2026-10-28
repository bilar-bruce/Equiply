<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <meta name="csrf-token" content="{{ csrf_token() }}">
    <meta name="color-scheme" content="light">
    <title>Equiply • USTP Campus Resource Nexus & P2P Gear Lending</title>
    <meta name="description" content="USTP hybrid campus borrowing and verified peer-to-peer equipment rental platform with real-time atomic reservation engine.">

    <script>
        (function() {
            try {
                var theme = localStorage.getItem('equiply_theme') || 'light';
                if (theme === 'dark') {
                    document.documentElement.classList.add('dark');
                    var meta = document.querySelector('meta[name="color-scheme"]');
                    if (meta) meta.content = 'dark';
                } else {
                    document.documentElement.classList.remove('dark');
                    var meta = document.querySelector('meta[name="color-scheme"]');
                    if (meta) meta.content = 'light';
                }
            } catch (e) {}
        })();
    </script>

    <!-- Fonts -->
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&family=Outfit:wght@400;500;600;700;800&display=swap" rel="stylesheet">

    @viteReactRefresh
    @vite(['resources/css/app.css', 'resources/js/app.jsx'])
</head>
<body class="bg-canvas-light dark:bg-canvas-dark text-slate-900 dark:text-slate-100 antialiased min-h-screen selection:bg-amber-400 selection:text-slate-900 font-['Inter',sans-serif]">
    <div id="root"></div>
</body>
</html>
