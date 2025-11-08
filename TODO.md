# TODO: Prevent Landing Page for Logged-In Users and Handle Logout

- [x] Modify `src/app/page.tsx` to conditionally render the Landing component only when the user is not logged in and not loading.
- [x] Remove auth check from `src/app/biblioteca/page.tsx` so it can be accessed without login.
- [x] Modify logout in `src/components/header/header.tsx` to redirect to "/" after logout.
