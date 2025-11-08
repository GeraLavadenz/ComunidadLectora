# TODO: Prevent Landing Page for Logged-In Users and Handle Logout

- [x] Modify `src/app/page.tsx` to conditionally render the Landing component only when the user is not logged in and not loading.
- [x] Add auth check in `src/app/biblioteca/page.tsx` to redirect to "/" if not logged in.
- [x] Modify logout in `src/components/header/header.tsx` to redirect to "/" after logout.
