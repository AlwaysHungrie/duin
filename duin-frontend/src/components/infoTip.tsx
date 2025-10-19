import { InfoIcon } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover";

export default function InfoTip({ text }: { text: string }) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <InfoIcon className="size-4" />
      </PopoverTrigger>
      <PopoverContent className="w-64 bg-white border border-gray-200 shadow-lg">
        <p className="text-sm text-gray-700">
          {text}
        </p>
      </PopoverContent>
    </Popover>
  );
}
