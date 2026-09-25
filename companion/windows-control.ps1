param([Parameter(Mandatory=$true)][ValidateSet('screen','foreground','click','type','key')][string]$Mode,[string]$Value,[int]$X,[int]$Y)
$ErrorActionPreference='Stop'
Add-Type -AssemblyName System.Windows.Forms
Add-Type -AssemblyName System.Drawing
Add-Type @'
using System; using System.Text; using System.Runtime.InteropServices;
public static class OpenWin {
 [DllImport("user32.dll")] public static extern IntPtr GetForegroundWindow();
 [DllImport("user32.dll")] public static extern uint GetWindowThreadProcessId(IntPtr h, out uint pid);
 [DllImport("user32.dll", CharSet=CharSet.Unicode)] public static extern int GetWindowText(IntPtr h, StringBuilder s, int n);
 [DllImport("user32.dll")] public static extern bool SetCursorPos(int x,int y);
 [DllImport("user32.dll")] public static extern void mouse_event(uint flags,uint dx,uint dy,uint data,UIntPtr info);
}
'@
$bounds=[System.Windows.Forms.SystemInformation]::VirtualScreen
if($Mode -eq 'screen') {
 $bmp=New-Object System.Drawing.Bitmap($bounds.Width,$bounds.Height)
 $g=[System.Drawing.Graphics]::FromImage($bmp)
 try {$g.CopyFromScreen($bounds.Left,$bounds.Top,0,0,$bounds.Size); $bmp.Save($Value,[System.Drawing.Imaging.ImageFormat]::Png)} finally {$g.Dispose();$bmp.Dispose()}
 exit
}
if($Mode -eq 'foreground') {
 $h=[OpenWin]::GetForegroundWindow();$sb=New-Object System.Text.StringBuilder(256);[void][OpenWin]::GetWindowText($h,$sb,$sb.Capacity)
 $targetPid=[uint32]0;[void][OpenWin]::GetWindowThreadProcessId($h,[ref]$targetPid);$proc=Get-Process -Id $targetPid -ErrorAction SilentlyContinue
 @{title=$sb.ToString();process=$proc.ProcessName;screen=@{left=$bounds.Left;top=$bounds.Top;width=$bounds.Width;height=$bounds.Height}} | ConvertTo-Json -Compress -Depth 4
 exit
}
if($Mode -eq 'click') {
 if($X -lt $bounds.Left -or $X -ge ($bounds.Left+$bounds.Width) -or $Y -lt $bounds.Top -or $Y -ge ($bounds.Top+$bounds.Height)){throw 'Outside visible screen'}
 [void][OpenWin]::SetCursorPos($X,$Y);[OpenWin]::mouse_event(2,0,0,0,[UIntPtr]::Zero);[OpenWin]::mouse_event(4,0,0,0,[UIntPtr]::Zero)
}
if($Mode -eq 'type') {
 # Literal text, not SendKeys syntax. Clipboard typing is intentionally avoided; Unicode SendInput targets the foreground app.
 Add-Type @'
using System; using System.Runtime.InteropServices;
public static class OpenText {
 [StructLayout(LayoutKind.Sequential)] public struct INPUT { public uint type; public U u; }
 [StructLayout(LayoutKind.Explicit)] public struct U { [FieldOffset(0)] public KEYBDINPUT ki; }
 [StructLayout(LayoutKind.Sequential)] public struct KEYBDINPUT { public ushort vk; public ushort scan; public uint flags; public uint time; public UIntPtr extra; }
 [DllImport("user32.dll")] public static extern uint SendInput(uint n, INPUT[] inputs, int cb);
 public static void Type(string text) { foreach(char c in text) { INPUT[] a=new INPUT[2]; a[0].type=a[1].type=1; a[0].u.ki.scan=a[1].u.ki.scan=c; a[0].u.ki.flags=4; a[1].u.ki.flags=6; if(SendInput(2,a,Marshal.SizeOf(typeof(INPUT)))!=2) throw new Exception("Input rejected"); } }
}
'@
 [OpenText]::Type($Value)
}
if($Mode -eq 'key') {
 $keys=@{Enter='{ENTER}';Escape='{ESC}';Tab='{TAB}';Backspace='{BACKSPACE}';Up='{UP}';Down='{DOWN}';Left='{LEFT}';Right='{RIGHT}';Home='{HOME}';End='{END}';PageUp='{PGUP}';PageDown='{PGDN}';'Ctrl+L'='^l';'Ctrl+F'='^f';'Ctrl+A'='^a';'Ctrl+S'='^s';'Ctrl+Z'='^z'}
 if(-not $keys.ContainsKey($Value)){throw 'Unsupported key'}
 [System.Windows.Forms.SendKeys]::SendWait($keys[$Value])
}
'OK'
