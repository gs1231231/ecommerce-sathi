export default function EditorLayout({ children }: { children: React.ReactNode }): React.ReactElement {
  return <div className="h-screen overflow-hidden">{children}</div>;
}
