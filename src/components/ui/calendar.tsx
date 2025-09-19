"use client";

import {
	ChevronDownIcon,
	ChevronLeftIcon,
	ChevronRightIcon,
} from "lucide-react";
import * as React from "react";
import { DayPicker } from "react-day-picker";
import { Button, buttonVariants } from "./button";
import { cn } from "../../lib/utils";

function Calendar({
	className,
	classNames,
	showOutsideDays = true,
	captionLayout = "label",
	buttonVariant = "ghost",
	formatters,
	components,
	...props
}: React.ComponentProps<typeof DayPicker> & {
	buttonVariant?: React.ComponentProps<typeof Button>["variant"];
}) {
	return (
		<DayPicker
			showOutsideDays={showOutsideDays}
			className={cn(
				// Solid panel styling so it doesn't blend with tables behind it
				"group/calendar z-50 rounded-md border border-input bg-background p-3 shadow-lg [--cell-size:--spacing(9)] md:[--cell-size:--spacing(11)]",
				String.raw`rtl:**:[.rdp-button\_next>svg]:rotate-180`,
				String.raw`rtl:**:[.rdp-button\_previous>svg]:rotate-180`,
				className,
			)}
			captionLayout={captionLayout}
			classNames={{
				root: cn("w-fit"),
				months: cn("flex gap-4 flex-col md:flex-row relative"),
				month: cn("flex flex-col w-full gap-4"),
				nav: cn(
					"flex items-center gap-1 w-full absolute top-0 inset-x-0 justify-between",
				),
				nav_button_previous: cn(
					buttonVariants({ variant: buttonVariant }),
					"size-(--cell-size) aria-disabled:opacity-50 p-0 select-none transition-colors duration-150 hover:bg-accent/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
				),
				nav_button_next: cn(
					buttonVariants({ variant: buttonVariant }),
					"size-(--cell-size) aria-disabled:opacity-50 p-0 select-none transition-colors duration-150 hover:bg-accent/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
				),
				caption: cn(
					"flex items-center justify-center h-(--cell-size) w-full px-(--cell-size)",
				),
				caption_label: cn(
					"select-none font-medium rounded-md pl-2 pr-1 flex items-center gap-1 text-sm h-8 [&>svg]:text-muted-foreground [&>svg]:size-3.5",
				),
				table: "w-full border-separate border-spacing-x-4 border-spacing-y-3",
				head_row: cn("text-muted-foreground text-xs"),
				head_cell: cn("pt-2 pb-1 text-center font-medium tracking-wide"),
				row: cn("[&_td]:align-middle"),
				cell: cn("p-2"),
				day: cn(
					"relative w-full h-full p-0 text-center [&:first-child[data-selected=true]_button]:rounded-l-md [&:last-child[data-selected=true]_button]:rounded-r-md group/day aspect-square select-none",
					className,
				),
				day_range_start: cn("rounded-l-md bg-accent"),
				day_range_middle: cn("rounded-none"),
				day_range_end: cn("rounded-r-md bg-accent"),
				day_today: cn(
					"bg-accent text-accent-foreground rounded-md data-[selected=true]:rounded-none",
				),
				day_outside: cn(
					"text-muted-foreground/70 aria-selected:text-muted-foreground",
				),
				day_disabled: cn("text-muted-foreground opacity-50"),
				vhidden: cn("invisible"),
				...classNames,
			}}
			{...props}
		/>
	);
}

function CalendarDayButton({
	className,
	day,
	modifiers,
	...props
}: {
	className?: string;
	day: { date: Date } & Record<string, unknown>;
	modifiers: Record<string, boolean>;
} & React.ComponentPropsWithoutRef<"button">) {
	const ref = React.useRef<HTMLButtonElement>(null);
	React.useEffect(() => {
		if (modifiers.focused) ref.current?.focus();
	}, [modifiers.focused]);

	return (
		<Button
			ref={ref}
			variant="ghost"
			size="icon"
			data-day={day.date.toLocaleDateString()}
			data-selected-single={
				modifiers.selected &&
				!modifiers.range_start &&
				!modifiers.range_end &&
				!modifiers.range_middle
			}
			data-range-start={modifiers.range_start}
			data-range-end={modifiers.range_end}
			data-range-middle={modifiers.range_middle}
			className={cn(
				"flex aspect-square size-auto w-full min-w-(--cell-size) flex-col gap-1 font-normal leading-none transition-colors duration-150 hover:bg-accent/40 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring data-[range-end=true]:rounded-md data-[range-middle=true]:rounded-none data-[range-start=true]:rounded-md data-[range-end=true]:rounded-r-md data-[range-start=true]:rounded-l-md data-[range-end=true]:bg-primary data-[range-middle=true]:bg-accent data-[range-start=true]:bg-primary data-[selected-single=true]:bg-primary data-[range-end=true]:text-primary-foreground data-[range-middle=true]:text-accent-foreground data-[range-start=true]:text-primary-foreground data-[selected-single=true]:text-primary-foreground group-data-[focused=true]/day:relative group-data-[focused=true]/day:z-10 group-data-[focused=true]/day:border-ring group-data-[focused=true]/day:ring-[3px] group-data-[focused=true]/day:ring-ring/50 dark:hover:text-accent-foreground [&>span]:text-xs [&>span]:opacity-70",
				className,
			)}
			{...props}
		/>
	);
}

export { Calendar, CalendarDayButton };
