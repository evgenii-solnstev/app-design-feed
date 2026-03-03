/**
 * Иконка логотипа Figma для ссылки «Figma».
 * Одноцветная, наследует currentColor. Источник: Simple Icons (Figma).
 */
export function FigmaLogoIcon({ className, size = 16 }: { className?: string; size?: number }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      width={size}
      height={size}
      className={className}
      aria-hidden
    >
      <path
        fill="currentColor"
        d="M15.852 8.981h-4.588V0h4.588c2.476 0 4.49 2.014 4.49 4.49s-2.014 4.49-4.49 4.49zM12.735 7.51h3.117c1.665 0 3.019-1.355 3.019-3.019s-1.355-3.019-3.019-3.019h-3.117V7.51zm0 1.471H8.148v3.019h4.588c2.476 0 4.49-2.014 4.49-4.49s-2.014-4.49-4.49-4.49H8.148v3.019H4.031V0h4.588c2.476 0 4.49 2.014 4.49 4.49s-2.014 4.49-4.49 4.49h4.588v1.471zm4.49-4.49h-4.49V0h4.49c2.476 0 4.49 2.014 4.49 4.49s-2.014 4.49-4.49 4.49z"
      />
    </svg>
  )
}
