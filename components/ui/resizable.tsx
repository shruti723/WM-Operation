// 'use client'

// import * as React from 'react'
// import { GripVerticalIcon } from 'lucide-react'
// import * as ResizablePrimitive from 'react-resizable-panels'
// import { cn } from '@/lib/utils'

// // Panel Group
// function ResizablePanelGroup({ className, ...props }: any) {
//   return (
//     <ResizablePrimitive.PanelGroup
//       className={cn(
//         'flex h-full w-full data-[panel-group-direction=vertical]:flex-col',
//         className
//       )}
//       {...props}
//     />
//   )
// }

// // Panel
// function ResizablePanel(props: any) {
//   return <ResizablePrimitive.Panel {...props} />
// }

// // Handle
// function ResizableHandle({ withHandle, className, ...props }: any) {
//   return (
//     <ResizablePrimitive.PanelResizeHandle
//       className={cn(
//         'bg-border relative flex w-px items-center justify-center',
//         className
//       )}
//       {...props}
//     >
//       {withHandle && (
//         <div className="bg-border z-10 flex h-4 w-3 items-center justify-center rounded-xs border">
//           <GripVerticalIcon className="size-2.5" />
//         </div>
//       )}
//     </ResizablePrimitive.PanelResizeHandle>
//   )
// }

// export { ResizablePanelGroup, ResizablePanel, ResizableHandle }