import Navbar from '@/components/Navbar';
import RoomNotFound from '@/components/RoomNotFound';

export default function NotFoundPage() {
  return (
    <div className="min-h-screen bg-background flex flex-col font-sans text-foreground">
      <Navbar />
      <RoomNotFound />
    </div>
  );
}
