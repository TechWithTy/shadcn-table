"use client";

import * as React from "react";
import { Drawer as DrawerPrimitive } from "vaul";

import { cn } from "../../lib/utils";

const Drawer = (
	props: React.ComponentProps<typeof DrawerPrimitive.Root>,
): React.ReactElement | null =>
	React.createElement(DrawerPrimitive.Root, {
		...props,
	});

const DrawerTrigger = (
	props: React.ComponentProps<typeof DrawerPrimitive.Trigger>,
): React.ReactElement | null =>
	React.createElement(DrawerPrimitive.Trigger, {
		...props,
	});

const DrawerPortal = (
	props: React.ComponentProps<typeof DrawerPrimitive.Portal>,
): React.ReactElement | null =>
	React.createElement(DrawerPrimitive.Portal, {
		...props,
	});

const DrawerClose = (
	props: React.ComponentProps<typeof DrawerPrimitive.Close>,
): React.ReactElement | null =>
	React.createElement(DrawerPrimitive.Close, {
		...props,
	});

const DrawerOverlay = React.forwardRef<
	React.ElementRef<typeof DrawerPrimitive.Overlay>,
	React.ComponentPropsWithoutRef<typeof DrawerPrimitive.Overlay>
>(({ className, ...props }, ref) =>
	React.createElement(DrawerPrimitive.Overlay, {
		ref,
		className: cn(
			"data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 fixed inset-0 z-50 bg-black/50 data-[state=closed]:animate-out data-[state=open]:animate-in",
			className,
		),
		...props,
	}),
);
DrawerOverlay.displayName = DrawerPrimitive.Overlay.displayName;

const DrawerContent = React.forwardRef<
	React.ElementRef<typeof DrawerPrimitive.Content>,
	React.ComponentPropsWithoutRef<typeof DrawerPrimitive.Content>
>(({ className, children, ...props }, ref) =>
	React.createElement(
		DrawerPortal,
		{},
		React.createElement(DrawerOverlay, null),
		React.createElement(
			DrawerPrimitive.Content,
			{
				ref,
				className: cn(
					"group/drawer-content fixed z-50 flex h-auto flex-col bg-background",
					"data-[vaul-drawer-direction=top]:inset-x-0 data-[vaul-drawer-direction=top]:top-0 data-[vaul-drawer-direction=top]:mb-24 data-[vaul-drawer-direction=top]:max-h-[80vh] data-[vaul-drawer-direction=top]:rounded-b-lg data-[vaul-drawer-direction=top]:border-b",
					"data-[vaul-drawer-direction=bottom]:inset-x-0 data-[vaul-drawer-direction=bottom]:bottom-0 data-[vaul-drawer-direction=bottom]:mt-24 data-[vaul-drawer-direction=bottom]:max-h-[80vh] data-[vaul-drawer-direction=bottom]:rounded-t-lg data-[vaul-drawer-direction=bottom]:border-t",
					"data-[vaul-drawer-direction=right]:inset-y-0 data-[vaul-drawer-direction=right]:right-0 data-[vaul-drawer-direction=right]:w-3/4 data-[vaul-drawer-direction=right]:border-l data-[vaul-drawer-direction=right]:sm:max-w-sm",
					"data-[vaul-drawer-direction=left]:inset-y-0 data-[vaul-drawer-direction=left]:left-0 data-[vaul-drawer-direction=left]:w-3/4 data-[vaul-drawer-direction=left]:border-r data-[vaul-drawer-direction=left]:sm:max-w-sm",
					className,
				),
				...props,
			},
			React.createElement("div", {
				className:
					"mx-auto mt-4 hidden h-2 w-[100px] shrink-0 rounded-full bg-muted group-data-[vaul-drawer-direction=bottom]/drawer-content:block",
			}),
			children,
		),
	),
);
DrawerContent.displayName = DrawerPrimitive.Content.displayName;

function DrawerHeader({
	className,
	...props
}: React.HTMLAttributes<HTMLDivElement>) {
	return (
		<div
			data-slot="drawer-header"
			className={cn("flex flex-col gap-1.5 p-4", className)}
			{...props}
		/>
	);
}

function DrawerFooter({
	className,
	...props
}: React.HTMLAttributes<HTMLDivElement>) {
	return (
		<div
			data-slot="drawer-footer"
			className={cn("mt-auto flex flex-col gap-2 p-4", className)}
			{...props}
		/>
	);
}

const DrawerTitle = React.forwardRef<
	React.ElementRef<typeof DrawerPrimitive.Title>,
	React.ComponentPropsWithoutRef<typeof DrawerPrimitive.Title>
>(({ className, ...props }, ref) =>
	React.createElement(DrawerPrimitive.Title, {
		ref,
		className: cn("font-semibold text-foreground", className),
		...props,
	}),
);
DrawerTitle.displayName = DrawerPrimitive.Title.displayName;

const DrawerDescription = React.forwardRef<
	React.ElementRef<typeof DrawerPrimitive.Description>,
	React.ComponentPropsWithoutRef<typeof DrawerPrimitive.Description>
>(({ className, ...props }, ref) =>
	React.createElement(DrawerPrimitive.Description, {
		ref,
		className: cn("text-muted-foreground text sm", className).replace(
			" text sm",
			" text-sm",
		),
		...props,
	}),
);
DrawerDescription.displayName = DrawerPrimitive.Description.displayName;

export {
	Drawer,
	DrawerPortal,
	DrawerOverlay,
	DrawerTrigger,
	DrawerClose,
	DrawerContent,
	DrawerHeader,
	DrawerFooter,
	DrawerTitle,
	DrawerDescription,
};
