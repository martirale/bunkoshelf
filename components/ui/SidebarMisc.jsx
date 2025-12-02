export default function SidebarMisc({ children }) {
  return (
    <>
      <aside className="flex md:w-[40%] lg:w-[32%] xl:w-[27%] 2xl:w-[20%] bg-pearl flex-col p-4 md:h-screen">
        {children}
      </aside>
    </>
  );
}
