'use client'

import { useRef, useState } from 'react'
import { ImagePlus, Library, Upload, X } from 'lucide-react'
import { toast } from 'sonner'
import { uploadImage } from '@/app/admin/upload/actions'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import MediaPickerDialog from '@/components/admin/MediaPickerDialog'

const MAX_FILE_SIZE = 8 * 1024 * 1024 // 8MB — sharp re-compresses on upload, this just caps unreasonable input

interface Props {
  label: string
  name: string // hidden input name — submits the image id
  initialId?: string | null
}

export default function ImagePicker({ label, name, initialId }: Props) {
  const [imageId, setImageId] = useState(initialId ?? '')
  const [previewUrl, setPreviewUrl] = useState(initialId ? `/api/images/${initialId}` : '')
  const [uploading, setUploading] = useState(false)
  const [libraryOpen, setLibraryOpen] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > MAX_FILE_SIZE) {
      toast.error(`File too large (max ${MAX_FILE_SIZE / 1024 / 1024}MB)`)
      e.target.value = ''
      return
    }
    setUploading(true)
    try {
      const fd = new FormData()
      fd.append('file', file)
      const { id, url } = await uploadImage(fd)
      setImageId(id)
      setPreviewUrl(url)
    } catch {
      toast.error('Upload failed. Please try again.')
    } finally {
      setUploading(false)
      e.target.value = ''
    }
  }

  const clear = () => {
    setImageId('')
    setPreviewUrl('')
  }

  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      <input type="hidden" name={name} value={imageId} />

      <div className="flex items-start gap-3">
        <div className="relative">
          <div className="flex h-20 w-32 items-center justify-center overflow-hidden rounded-lg border bg-muted/40">
            {previewUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={previewUrl} alt="" className="h-full w-full object-cover" />
            ) : (
              <ImagePlus className="h-5 w-5 text-muted-foreground/50" />
            )}
          </div>
          {previewUrl && (
            <button
              type="button"
              onClick={clear}
              className="absolute -top-2 -right-2 flex h-5 w-5 items-center justify-center rounded-full bg-destructive text-white shadow ring-2 ring-background"
              aria-label="Remove image"
            >
              <X className="h-3 w-3" />
            </button>
          )}
        </div>

        <div className="flex flex-col gap-2">
          <input ref={fileRef} type="file" accept="image/*" className="sr-only" onChange={handleUpload} disabled={uploading} />
          <Button type="button" variant="outline" size="sm" disabled={uploading} onClick={() => fileRef.current?.click()}>
            <Upload className="h-4 w-4" /> {uploading ? 'Uploading…' : 'Upload'}
          </Button>
          <Button type="button" variant="outline" size="sm" onClick={() => setLibraryOpen(true)}>
            <Library className="h-4 w-4" /> Library
          </Button>
        </div>
      </div>

      <MediaPickerDialog
        open={libraryOpen}
        onOpenChange={setLibraryOpen}
        onSelect={(id, url) => {
          setImageId(id)
          setPreviewUrl(url)
        }}
      />
    </div>
  )
}
