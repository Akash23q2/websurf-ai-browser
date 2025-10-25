"""
Debug script to identify MCP connection issues
Run: python debug_mcp.py
"""

import asyncio
import os
import sys
from pathlib import Path


async def test_mcp_connection():
    print("=" * 60)
    print("MCP Connection Debugging")
    print("=" * 60)
    
    # Step 1: Check Node.js
    print("\n1. Checking Node.js installation...")
    import subprocess
    try:
        result = subprocess.run(['node', '--version'], capture_output=True, text=True)
        print(f"✓ Node.js version: {result.stdout.strip()}")
    except Exception as e:
        print(f"✗ Node.js not found: {e}")
        print("  Install Node.js from https://nodejs.org/")
        return False
    
    # Step 2: Find browser-mcp.js
    print("\n2. Looking for browser-mcp.js...")
    script_paths = [
        'playwright-mcp/browser-mcp.js',
        'browser-mcp.js',
        '../playwright-mcp/browser-mcp.js',
    ]
    
    browser_script = None
    for path in script_paths:
        abs_path = os.path.abspath(path)
        print(f"   Checking: {abs_path}")
        if os.path.exists(path):
            browser_script = abs_path
            print(f"   ✓ Found: {browser_script}")
            break
    
    if not browser_script:
        print("✗ browser-mcp.js not found!")
        print("\nSuggested fix:")
        print("1. cd to your project root")
        print("2. Ensure playwright-mcp/browser-mcp.js exists")
        print("3. Or set MCP_BROWSER_SCRIPT_PATH in .env")
        return False
    
    # Step 3: Check package.json
    print("\n3. Checking package.json...")
    pkg_json_path = os.path.join(os.path.dirname(browser_script), 'package.json')
    if os.path.exists(pkg_json_path):
        import json
        with open(pkg_json_path, 'r') as f:
            pkg = json.load(f)
        
        if pkg.get('type') == 'module':
            print("✓ package.json has 'type': 'module'")
        else:
            print("✗ package.json missing 'type': 'module'")
            print("  Add this to package.json:")
            print('  "type": "module"')
            return False
    else:
        print(f"✗ package.json not found at {pkg_json_path}")
        return False
    
    # Step 4: Test starting the server directly
    print("\n4. Testing Node.js server startup...")
    try:
        proc = subprocess.Popen(
            ['node', browser_script],
            stdin=subprocess.PIPE,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            text=False
        )
        
        # Wait a bit for startup
        await asyncio.sleep(2)
        
        if proc.poll() is None:
            print("✓ Server process started successfully")
            proc.terminate()
            proc.wait(timeout=5)
        else:
            stderr = proc.stderr.read().decode('utf-8', errors='ignore')
            print(f"✗ Server exited immediately")
            print(f"  Error output: {stderr}")
            return False
            
    except Exception as e:
        print(f"✗ Failed to start server: {e}")
        return False
    
    # Step 5: Test with MCPServerStdio
    print("\n5. Testing MCPServerStdio...")
    try:
        from pydantic_ai.mcp import MCPServerStdio
        
        client = MCPServerStdio(
            command='node',
            args=[browser_script],
            timeout=30
        )
        print("✓ MCPServerStdio created")
        
        # Try to connect
        print("  Attempting to connect...")
        async with client:
            print("  ✓ Connected successfully!")
            tools = await client.list_tools()
            print(f"  ✓ Found {len(tools)} tools")
            return True
            
    except Exception as e:
        print(f"✗ Connection failed: {e}")
        import traceback
        traceback.print_exc()
        return False


async def main():
    success = await test_mcp_connection()
    
    print("\n" + "=" * 60)
    if success:
        print("✅ ALL CHECKS PASSED!")
        print("=" * 60)
        print("\nYour MCP setup should work correctly.")
        print("If you still have issues, the problem is likely in your FastAPI app.")
    else:
        print("❌ ISSUES FOUND")
        print("=" * 60)
        print("\nFix the issues above before proceeding.")
    
    return success


if __name__ == "__main__":
    result = asyncio.run(main())
    sys.exit(0 if result else 1)