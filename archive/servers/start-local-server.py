#!/usr/bin/env python3
"""
Simple Local Server for LOS App Testing
This script starts a local HTTP server to avoid CORS issues when testing modules.
"""

import http.server
import socketserver
import os
import sys
import webbrowser
from pathlib import Path

def start_local_server():
    # Get the current directory
    current_dir = Path.cwd()
    print(f"🧪 Starting local server in: {current_dir}")
    
    # Check if we're in the right directory
    if not (current_dir / "src").exists():
        print("❌ Error: 'src' directory not found!")
        print("   Please run this script from your project root directory")
        input("Press Enter to exit...")
        return
    
    # Port for the server
    PORT = 8000
    
    # Change to the project directory
    os.chdir(current_dir)
    
    # Create a simple HTTP server
    Handler = http.server.SimpleHTTPRequestHandler
    
    try:
        with socketserver.TCPServer(("", PORT), Handler) as httpd:
            print(f"✅ Local server started successfully!")
            print(f"🌐 Server running at: http://localhost:{PORT}")
            print(f"📁 Serving files from: {current_dir}")
            print("")
            print("🚀 Opening test app in browser...")
            print("💡 Keep this terminal open while testing")
            print("💡 Press Ctrl+C to stop the server")
            print("")
            
            # Open the test app in the default browser
            test_url = f"http://localhost:{PORT}/test-app-local.html"
            webbrowser.open(test_url)
            
            print(f"🔗 Test app opened at: {test_url}")
            print("")
            
            # Start serving
            httpd.serve_forever()
            
    except OSError as e:
        if "Address already in use" in str(e):
            print(f"❌ Port {PORT} is already in use!")
            print(f"   Another server might be running on port {PORT}")
            print(f"   Try closing other applications or use a different port")
        else:
            print(f"❌ Error starting server: {e}")
        input("Press Enter to exit...")
    except KeyboardInterrupt:
        print("\n🛑 Server stopped by user")
        print("👋 Goodbye!")

if __name__ == "__main__":
    print("🧪 LOS App - Local Testing Server")
    print("==================================")
    start_local_server()


