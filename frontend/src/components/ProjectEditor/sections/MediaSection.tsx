import { useRef } from "react";
import { FiImage, FiStar, FiVideo } from "react-icons/fi";
import type { ProjectImage, ProjectVideo } from "../../../types/project";
import {
  AddButton,
  CompletionBadge,
  FieldLabel,
  RemoveButton,
  SectionCard,
  TextInput,
} from "../EditorShared";

type Props = {
  images: ProjectImage[];
  videos: ProjectVideo[];
  onAddImage: (file: File) => void;
  onUpdateImage: (id: string, c: Partial<ProjectImage>) => void;
  onRemoveImage: (id: string) => void;
  onSetPrimary: (id: string) => void;
  onAddVideo: () => void;
  onUpdateVideo: (id: string, c: Partial<ProjectVideo>) => void;
  onRemoveVideo: (id: string) => void;
};

export function MediaSection({
  images, videos,
  onAddImage, onUpdateImage, onRemoveImage, onSetPrimary,
  onAddVideo, onUpdateVideo, onRemoveVideo,
}: Props) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const total = images.length + videos.length;

  return (
    <SectionCard
      id="section-media"
      icon={<FiImage className="h-4 w-4" />}
      title="Mídia"
      subtitle="Imagens e vídeos que ilustram o projeto"
      badge={<CompletionBadge count={total} />}
      defaultOpen={total > 0}
    >
      <div className="space-y-6">
        {/* ── Imagens ── */}
        <div>
          <FieldLabel hint="Formatos: JPG, PNG, WebP. A primeira imagem será a capa.">
            Imagens
          </FieldLabel>

          {images.length > 0 && (
            <div className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
              {images.map((img) => (
                <div
                  key={img.id}
                  className={`group relative overflow-hidden rounded-xl border-2 ${
                    img.isPrimary ? "border-[#6fa8d6]" : "border-[#e5e7eb]"
                  }`}
                >
                  <img
                    src={img.url}
                    alt={img.caption || "Imagem do projeto"}
                    className="h-32 w-full object-cover"
                  />

                  {/* Overlay de ações */}
                  <div className="absolute inset-0 flex flex-col justify-between bg-[#000]/0 p-2 opacity-0 transition group-hover:bg-[#000]/40 group-hover:opacity-100">
                    <div className="flex justify-end">
                      <RemoveButton onClick={() => onRemoveImage(img.id)} label="Remover imagem" />
                    </div>
                    {!img.isPrimary && (
                      <button
                        type="button"
                        onClick={() => onSetPrimary(img.id)}
                        className="flex items-center gap-1 self-start rounded-lg bg-white/90 px-2 py-1 text-[0.72rem] font-semibold text-[#b45309]"
                      >
                        <FiStar className="h-3 w-3" />
                        Definir capa
                      </button>
                    )}
                  </div>

                  {img.isPrimary && (
                    <span className="absolute left-2 top-2 flex items-center gap-1 rounded-lg bg-[#6fa8d6] px-2 py-0.5 text-[0.68rem] font-bold text-white">
                      <FiStar className="h-2.5 w-2.5" /> Capa
                    </span>
                  )}

                  {/* Caption */}
                  <input
                    type="text"
                    value={img.caption ?? ""}
                    onChange={(e) => onUpdateImage(img.id, { caption: e.target.value })}
                    placeholder="Legenda…"
                    className="w-full border-0 border-t border-[#e5e7eb] bg-white px-2.5 py-1.5 text-[0.74rem] text-[#374151] placeholder:text-[#9ca3af] focus:outline-none"
                  />
                </div>
              ))}
            </div>
          )}

          {/* Upload drop zone */}
          <div
            onClick={() => fileInputRef.current?.click()}
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault();
              Array.from(e.dataTransfer.files).forEach((f) => {
                if (f.type.startsWith("image/")) onAddImage(f);
              });
            }}
            className="flex cursor-pointer flex-col items-center gap-2 rounded-xl border-2 border-dashed border-[#bfdbfe] bg-[#f8fbff] px-4 py-8 text-center transition hover:border-[#93c5fd] hover:bg-[#eff6ff]"
          >
            <FiImage className="h-8 w-8 text-[#93c5fd]" />
            <p className="text-[0.84rem] font-semibold text-[#1d4ed8]">
              Clique para fazer upload ou arraste aqui
            </p>
            <p className="text-[0.74rem] text-[#9ca3af]">JPG, PNG, WebP · máx. 5 MB cada</p>
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={(e) =>
              Array.from(e.target.files ?? []).forEach((f) => onAddImage(f))
            }
          />
        </div>

        {/* ── Vídeos ── */}
        <div>
          <FieldLabel hint="Cole a URL do YouTube, Vimeo ou outro player web">
            Vídeos
          </FieldLabel>

          <div className="space-y-3">
            {videos.map((vid, idx) => (
              <div key={vid.id} className="rounded-xl border border-[#e8e9f0] bg-[#f8f9fc] p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1.5 text-[0.78rem] font-bold uppercase tracking-wide text-[#9ca3af]">
                    <FiVideo className="h-3.5 w-3.5" /> Vídeo {idx + 1}
                  </span>
                  <RemoveButton onClick={() => onRemoveVideo(vid.id)} />
                </div>

                <div>
                  <FieldLabel htmlFor={`vid-title-${vid.id}`}>Título</FieldLabel>
                  <TextInput
                    id={`vid-title-${vid.id}`}
                    value={vid.title}
                    onChange={(v) => onUpdateVideo(vid.id, { title: v })}
                    placeholder="Ex.: Apresentação do sistema"
                  />
                </div>

                <div>
                  <FieldLabel htmlFor={`vid-url-${vid.id}`}>URL do Vídeo</FieldLabel>
                  <TextInput
                    id={`vid-url-${vid.id}`}
                    value={vid.url}
                    onChange={(v) => onUpdateVideo(vid.id, { url: v })}
                    placeholder="https://youtube.com/watch?v=..."
                  />
                </div>

                <div>
                  <FieldLabel htmlFor={`vid-caption-${vid.id}`} hint="Opcional">Legenda</FieldLabel>
                  <TextInput
                    id={`vid-caption-${vid.id}`}
                    value={vid.caption ?? ""}
                    onChange={(v) => onUpdateVideo(vid.id, { caption: v })}
                    placeholder="Breve descrição do vídeo"
                  />
                </div>
              </div>
            ))}

            <AddButton onClick={onAddVideo}>Adicionar vídeo</AddButton>
          </div>
        </div>
      </div>
    </SectionCard>
  );
}
