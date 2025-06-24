export default function ServiceBanner() {
  return (
    <div className="w-full bg-black dark:bg-black py-2 px-4 text-center shadow-sm">
      <div className="flex items-center justify-center space-x-2">
        <img src="/favicon-16x16.png" alt="Wrickit Logo" className="w-4 h-4" />
        <h1 className="text-lg font-semibold">Wrickit - Connect with Your Classmates</h1>
      </div>
    </div>
  );
}