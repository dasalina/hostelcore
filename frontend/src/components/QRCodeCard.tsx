import { Card, CardContent } from "./ui/card";

interface QRCodeCardProps {
  qrSvg: string;
}

export function QRCodeCard({ qrSvg }: QRCodeCardProps) {
  return (
    <Card className="flex flex-col">
      <CardContent className="p-6 flex flex-col justify-start items-center">
        <div className="text-center space-y-4 w-full">
          <p className="text-sm text-gray-600">Scan for directions</p>
          <div
            className="w-48 h-48 mx-auto overflow-hidden flex items-center justify-center"
            dangerouslySetInnerHTML={{ __html: qrSvg }}
          />
        </div>
        <style>{`
          .text-center svg {
            max-width: 160px !important;
            max-height: 160px !important;
            width: 100% !important;
            height: auto !important;
          }
        `}</style>
      </CardContent>
    </Card>
  );
}