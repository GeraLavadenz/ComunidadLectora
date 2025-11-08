# TODO: Make Landing Page 100% Responsive

## Header
- [x] Review and update `src/components/header/styles/header.module.css` for full responsiveness across mobile, tablet, and desktop.
- [x] Ensure logo, navigation, search, and actions scale properly on small screens.
- [x] Test mobile menu dropdown and search functionality.
- [x] Update header to show mobile menu from 1024px width instead of 768px, consolidating all menus into one dropdown.
- [x] Remove duplicate search bars - keep only one search in mobile menu.
- [x] Move login/register buttons outside the mobile menu dropdown to separate buttons.
- [x] Keep the original menu structure with three main options (Explora, Comunidad, Crear) that expand when pressed.

## Footer
- [x] Review `src/components/footer/footer.tsx` (uses Tailwind, seems responsive, but confirm).
- [x] Ensure links wrap properly on mobile and spacing is adequate.

## Landing Sections
- [x] Update `src/modules/landing/styles/HeroSection.css` for better mobile layout, font sizes, and button stacking.
- [x] Update `src/modules/landing/styles/BookGallerySection.css` for responsive title and container.
- [x] Update `src/modules/landing/styles/BookShelvesSection.css` for mobile stacking of shelves and text.
- [x] Update `src/modules/landing/styles/comentsection.css` for responsive layout on mobile (stack image and text vertically).

## General
- [x] Test all sections on various screen sizes (mobile: 320px, tablet: 768px, desktop: 1024px+).
- [x] Ensure no horizontal scroll and proper padding/margins.
- [x] Verify animations and images scale correctly.
