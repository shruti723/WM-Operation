"use client"

import * as React from "react"
import { format } from "date-fns"
import { CalendarIcon } from "lucide-react"
import { DateRange } from "react-day-picker"

import { cn } from "@/lib/utils"

import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover"

export function DateRangePicker({
    date,
    setDate,
}: {
    date: DateRange | undefined
    setDate: (date: DateRange | undefined) => void
}) {
    return (

        <Popover>
            <PopoverTrigger asChild>
                <Button
                    variant="outline"
                    className={cn(
                        "w-[220px] h-[40px] justify-start text-left font-normal",
                        !date && "text-muted-foreground"
                    )}
                >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {date?.from ? (
                        date.to ? (
                            <>
                                {format(date.from, "dd MMM")} - {format(date.to, "dd MMM")}
                            </>
                        ) : (
                            format(date.from, "dd MMM")
                        )
                    ) : (
                        <span>Select date range</span>
                    )}
                </Button>
            </PopoverTrigger>

            <PopoverContent
                className="w-[280px] p-2 rounded-xl shadow-lg border"
                align="start"
            >
                <Calendar
                    mode="range"
                    selected={date}
                    onSelect={setDate}
                    numberOfMonths={1}
                    className="p-2"
                />
            </PopoverContent>
        </Popover>
    )
}