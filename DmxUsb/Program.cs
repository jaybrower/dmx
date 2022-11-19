using System;
using System.Collections.Generic;

namespace DmxUsb
{
    class Program
    {
        static void Main(string[] args)
        {
            OpenDmx.start();

            switch (OpenDmx.status)
            {
                case Status.FT_DEVICE_NOT_FOUND:
                    Console.WriteLine("No Enttec USB device found.");
                    break;
                case Status.FT_OK:
                    Console.WriteLine("Enttec USB device found.");
                    break;
                default:
                    Console.WriteLine("Error opening Enttec USB device.");
                    break;
            }

            Console.Write("DMX Channel Values: ");
            var bytesInput = Console.ReadLine();

            var index = 1;
            foreach (var byteInput in bytesInput.Split(','))
            {
                if (!byte.TryParse(byteInput, out var byteValue))
                {
                    byteValue = 0;
                }

                OpenDmx.setDmxValue(index, byteValue);

                index++;
            }

            OpenDmx.writeData();

            Console.ReadLine();
        }
    }
}
