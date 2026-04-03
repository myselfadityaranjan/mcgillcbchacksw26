import { useRef, useState, useCallback, useEffect } from 'react'

export type CameraFacing = 'user' | 'environment'
export type CameraPermission = 'idle' | 'requesting' | 'granted' | 'denied' | 'unavailable'

export interface CameraState {
  permission: CameraPermission
  stream: MediaStream | null
  error: string | null
  deviceId: string | null
  devices: MediaDeviceInfo[]
}

/**
 * Camera access hook — handles getUserMedia, permission states, and cleanup.
 * Person 1 consumes the returned videoRef to feed into MediaPipe.
 */
export function useCamera(facing: CameraFacing = 'user') {
  const videoRef = useRef<HTMLVideoElement>(null)
  const streamRef = useRef<MediaStream | null>(null)

  const [state, setState] = useState<CameraState>({
    permission: 'idle',
    stream: null,
    error: null,
    deviceId: null,
    devices: [],
  })

  const startCamera = useCallback(async (deviceId?: string) => {
    setState((s) => ({ ...s, permission: 'requesting', error: null }))

    try {
      const constraints: MediaStreamConstraints = {
        video: {
          facingMode: facing,
          width: { ideal: 1280 },
          height: { ideal: 720 },
          frameRate: { ideal: 30 },
          ...(deviceId ? { deviceId: { exact: deviceId } } : {}),
        },
        audio: false,
      }

      const stream = await navigator.mediaDevices.getUserMedia(constraints)
      streamRef.current = stream

      if (videoRef.current) {
        videoRef.current.srcObject = stream
        await videoRef.current.play()
      }

      // Enumerate available cameras
      const devices = await navigator.mediaDevices.enumerateDevices()
      const cameras = devices.filter((d) => d.kind === 'videoinput')
      const track = stream.getVideoTracks()[0]

      setState({
        permission: 'granted',
        stream,
        error: null,
        deviceId: track?.getSettings().deviceId ?? null,
        devices: cameras,
      })
    } catch (err) {
      const error = err as DOMException
      let message = 'Camera access failed'
      let permission: CameraPermission = 'denied'

      if (error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError') {
        message = 'Camera permission was denied. Please allow camera access and try again.'
        permission = 'denied'
      } else if (error.name === 'NotFoundError' || error.name === 'DevicesNotFoundError') {
        message = 'No camera found on this device.'
        permission = 'unavailable'
      } else if (error.name === 'NotReadableError') {
        message = 'Camera is already in use by another application.'
        permission = 'unavailable'
      }

      setState((s) => ({ ...s, permission, error: message }))
    }
  }, [facing])

  const stopCamera = useCallback(() => {
    streamRef.current?.getTracks().forEach((t) => t.stop())
    streamRef.current = null
    if (videoRef.current) {
      videoRef.current.srcObject = null
    }
    setState((s) => ({
      ...s,
      stream: null,
      permission: s.permission === 'granted' ? 'idle' : s.permission,
    }))
  }, [])

  const switchCamera = useCallback(
    async (deviceId: string) => {
      stopCamera()
      await startCamera(deviceId)
    },
    [stopCamera, startCamera]
  )

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      streamRef.current?.getTracks().forEach((t) => t.stop())
    }
  }, [])

  return {
    videoRef,
    state,
    startCamera,
    stopCamera,
    switchCamera,
  }
}
