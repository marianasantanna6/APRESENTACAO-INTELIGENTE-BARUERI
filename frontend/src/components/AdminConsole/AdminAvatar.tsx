type AdminAvatarProps = {
  name: string;
  imageSrc?: string | null;
  sizeClassName?: string;
  textClassName?: string;
  className?: string;
};

function getInitials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);

  if (parts.length === 0) {
    return "?";
  }

  return parts
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join("");
}

export default function AdminAvatar({
  name,
  imageSrc,
  sizeClassName = "h-10 w-10",
  textClassName = "text-[0.9rem]",
  className = "",
}: AdminAvatarProps) {
  return (
    <div
      className={`flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-[linear-gradient(180deg,#8cb7dc_0%,#5f9cd0_100%)] font-bold text-white shadow-[0_10px_24px_rgba(103,156,203,0.24)] ${sizeClassName} ${className}`}
      aria-hidden="true"
    >
      {imageSrc ? (
        <img src={imageSrc} alt="" className="h-full w-full object-cover" />
      ) : (
        <span className={textClassName}>{getInitials(name)}</span>
      )}
    </div>
  );
}
