// Legacy ICNS/ICO do not carry an Icon Composer mask. Apply one at export time.
// Keep the opaque iOS and Apple touch artwork untouched: those are masked by the OS.
import AppKit
let source = CommandLine.arguments[1]
let destination = CommandLine.arguments[2]
let size = 1024
let bitmap = NSBitmapImageRep(bitmapDataPlanes: nil, pixelsWide: size, pixelsHigh: size, bitsPerSample: 8, samplesPerPixel: 4, hasAlpha: true, isPlanar: false, colorSpaceName: .deviceRGB, bytesPerRow: 0, bitsPerPixel: 0)!
let context = NSGraphicsContext(bitmapImageRep: bitmap)!
NSGraphicsContext.saveGraphicsState()
NSGraphicsContext.current = context
context.imageInterpolation = .high
// Keep a transparent safety margin so Finder never renders the artwork as a
// square tile. The large corner radius matches the macOS app-icon silhouette.
let bounds = NSRect(x: 72, y: 72, width: 880, height: 880)
NSBezierPath(roundedRect: bounds, xRadius: 198, yRadius: 198).addClip()
NSColor.black.setFill()
bounds.fill()
NSImage(contentsOfFile: source)!.draw(in: bounds, from: .zero, operation: .sourceOver, fraction: 1)
NSGraphicsContext.restoreGraphicsState()
// Fail generation if alpha masking regresses.
precondition(bitmap.colorAt(x: 0, y: 0)!.alphaComponent == 0)
precondition(bitmap.colorAt(x: 512, y: 512)!.alphaComponent == 1)
precondition(bitmap.colorAt(x: 72, y: 72)!.alphaComponent == 0)
try bitmap.representation(using: .png, properties: [:])!.write(to: URL(fileURLWithPath: destination))
