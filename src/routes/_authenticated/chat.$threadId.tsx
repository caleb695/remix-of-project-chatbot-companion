          <div className="border-t border-border/60 p-3">
            <Button variant="secondary" className="w-full" disabled={uploading} onClick={() => fileRef.current?.click()}>
              <Plus className="mr-1 h-4 w-4" /> Add files
            </Button>
            <Button variant="secondary" className="w-full mt-2" onClick={() => window.open('/drive-upload', '_blank')}>
              <Plus className="mr-1 h-4 w-4" /> Upload from Google Drive
            </Button>
          </div>
