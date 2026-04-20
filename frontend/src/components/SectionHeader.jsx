function SectionHeader({ title, description }) {
  return (
    <div className="text-center">
      <h2 className="text-[2.1rem] font-extrabold tracking-[-0.03em] text-[#252525] sm:text-[2.6rem]">
        {title}
      </h2>
      <p className="mt-3 text-sm text-black/35 sm:text-base">{description}</p>
    </div>
  )
}

export default SectionHeader
