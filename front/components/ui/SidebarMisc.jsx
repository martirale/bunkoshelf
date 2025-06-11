export default function SidebarMisc({ children }) {
  return (
    <>
      <aside className="flex md:w-4/12 2xl:w-3/12 bg-pearl flex-col p-4 md:h-screen">
        {children}
      </aside>
    </>
  );
}
