Refreshing
==========
Refreshing is a Chrome extension for reloading file:// pages when their on-disk content changes.

How to use it
=============
Because Chrome doesn't expose APIs that allow extensions to detect file changes on your filesystem, getting Refreshing to work requires running a small Node.js server in addition to having the extension installed. The extension asks the server to watch for file changes on its behalf.

Step 1: Install the extension
-----------------------------

  1. Open Chrome's extension menu (Chrome menu -> Tools -> Extensions).
  2. Check the 'Developer mode' box in the upper right to expose the "Load unpacked extension..." button.
  3. Click the 'Load unpacked extension...' button and choose the 'chrome-extension' folder of this repository with the file-picker
  4. Refreshing is installed!

Step 2: Run the server
----------------------
  1. Execute something like this in a terminal: node node-server/server.js
  2. The server is running!

Step 3: Use Refreshing
----------------------
  1. When viewing a file on your local filesystem (see that the protocol in
     your address bar is 'file://'), the refreshing icon will show up in the
     right of the address bar.
  3. Click the refreshing icon then click start.
  4. Refreshing is refreshing!
