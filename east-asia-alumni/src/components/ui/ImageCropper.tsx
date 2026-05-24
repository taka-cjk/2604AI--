"use client"

import { useState, useRef } from "react"
import ReactCrop, {
  type Crop,
  type PixelCrop,
  makeAspectCrop,
  centerCrop,
} from "react-image-crop"
import "react-image-crop/dist/ReactCrop.css"

type AspectOption = { label: string; value: number }

const ASPECT_OPTIONS: AspectOption[] = [
  { label: "16:9", value: 16 / 9 },
  { label: "4:3", value: 4 / 3 },
  { label: "1:1", value: 1 },
]

type Props = {
  src: string
  onConfirm: (file: File) => void
  onCancel: () => void
}

export function ImageCropper({ src, onConfirm, onCancel }: Props) {
  const imgRef = useRef<HTMLImageElement>(null)
  const [crop, setCrop] = useState<Crop | undefined>(undefined)
  const [completedCrop, setCompletedCrop] = useState<PixelCrop | undefined>(undefined)
  const [aspectIndex, setAspectIndex] = useState(0)

  function onImageLoad(e: React.SyntheticEvent<HTMLImageElement>) {
    const { naturalWidth: w, naturalHeight: h } = e.currentTarget
    const c = centerCrop(
      makeAspectCrop({ unit: "%", width: 90 }, ASPECT_OPTIONS[0].value, w, h),
      w, h
    )
    setCrop(c)
  }

  function handleAspectChange(index: number) {
    setAspectIndex(index)
    if (!imgRef.current) return
    const { naturalWidth: w, naturalHeight: h } = imgRef.current
    const c = centerCrop(
      makeAspectCrop({ unit: "%", width: 90 }, ASPECT_OPTIONS[index].value, w, h),
      w, h
    )
    setCrop(c)
  }

  function handleConfirm() {
    if (!completedCrop || !imgRef.current) return
    const img = imgRef.current
    const scaleX = img.naturalWidth / img.width
    const scaleY = img.naturalHeight / img.height

    const canvas = document.createElement("canvas")
    canvas.width = completedCrop.width * scaleX
    canvas.height = completedCrop.height * scaleY

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    ctx.drawImage(
      img,
      completedCrop.x * scaleX,
      completedCrop.y * scaleY,
      completedCrop.width * scaleX,
      completedCrop.height * scaleY,
      0, 0,
      canvas.width,
      canvas.height,
    )

    canvas.toBlob((blob) => {
      if (!blob) return
      onConfirm(new File([blob], "banner.jpg", { type: "image/jpeg" }))
    }, "image/jpeg", 0.9)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl flex flex-col gap-4 p-6">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold text-slate-900">Crop Banner Image</h2>
          <div className="flex gap-1">
            {ASPECT_OPTIONS.map((opt, i) => (
              <button
                key={opt.label}
                type="button"
                onClick={() => handleAspectChange(i)}
                className={`px-3 py-1 text-xs rounded-lg font-medium transition-colors ${
                  aspectIndex === i
                    ? "bg-indigo-600 text-white"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        <div className="overflow-hidden rounded-lg max-h-[60vh] flex items-center justify-center bg-slate-100">
          <ReactCrop
            crop={crop}
            onChange={(c) => setCrop(c)}
            onComplete={(c) => setCompletedCrop(c)}
            aspect={ASPECT_OPTIONS[aspectIndex].value}
            keepSelection
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              ref={imgRef}
              src={src}
              alt="Crop preview"
              onLoad={onImageLoad}
              className="max-h-[55vh] max-w-full object-contain"
            />
          </ReactCrop>
        </div>

        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 text-sm rounded-lg text-slate-600 bg-slate-100 hover:bg-slate-200 transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={!completedCrop}
            className="px-4 py-2 text-sm rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-40 transition-colors"
          >
            Crop & Use
          </button>
        </div>
      </div>
    </div>
  )
}
