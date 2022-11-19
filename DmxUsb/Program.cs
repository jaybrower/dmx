using System;
using System.IO;
using System.Linq;
using System.Threading;

namespace DmxUsb
{
    class Program
    {
        static string QueueDirectorEnvVar = "DMX_USB_QUEUE_DIRECTORY";

        static Thread ReadQueueThread = null;
        static Thread WriteDataThread = null;

        static void Main(string[] args)
        {
            OpenDmx.start();

            switch (OpenDmx.status)
            {
                case Status.FT_OK:
                    Console.WriteLine("Enttec USB device found.");
                    break;
                case Status.FT_DEVICE_NOT_FOUND:
                    Console.WriteLine("No Enttec USB device found.");
                    return;
                default:
                    Console.WriteLine("Error opening Enttec USB device.");
                    return;
            }

            var queuePath = Environment.GetEnvironmentVariable(QueueDirectorEnvVar, EnvironmentVariableTarget.User);
            try
            {
                Path.GetFullPath(queuePath);
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Queue path defined by \"{QueueDirectorEnvVar}\" env variable is invalid: {ex.Message}");
                Console.Write("Press any key to exit.");
                Console.Read();
                return;
            }

            WriteDataThread = new Thread(() =>
            {
                do
                {
                    try
                    {
                        OpenDmx.writeData();
                        Thread.Sleep(50);
                    }
                    catch (Exception ex)
                    {
                        Console.WriteLine($"Writing data to DMX USB interface failed: {ex.Message}");
                    }
                }
                while (true);
            });
            WriteDataThread.IsBackground = true;
            WriteDataThread.Start();

            ReadQueueThread = new Thread(() =>
            {
                do
                {
                    try
                    {
                        var queueFiles = Directory.GetFiles(queuePath);

                        // Wait for files to be added to the queue.
                        if (queueFiles.Length == 0)
                        {
                            Thread.Sleep(500);
                            continue;
                        }

                        // Files should be named in milliseconds based on their
                        // timestamp so we want the earlier file.
                        var fileMilliseconds = queueFiles
                            .ToList()
                            .Select(fileName =>
                            {
                                if (long.TryParse(fileName.Split('\\').Last(), out var milliseconds))
                                {
                                    return milliseconds;
                                }

                                return long.MaxValue;
                            })
                            .OrderBy(milliseconds => milliseconds)
                            .First();

                        // Ignore files that should be executed in the future.
                        if (fileMilliseconds > DateTimeOffset.Now.ToUnixTimeMilliseconds())
                        {
                            continue;
                        }

                        var filePath = Path.Combine(queuePath, fileMilliseconds.ToString());
                        var text = File.ReadAllText(filePath);

                        // If the file is empty we should delete it and move to the next.
                        if (string.IsNullOrWhiteSpace(text))
                        {
                            File.Delete(filePath);
                            continue;
                        }

                        // Parse the file data and create an array to update the DMX
                        // channel values.
                        var values = text.Split(',');

                        var byteArray = CreateNewChannelByteArray();
                        var index = 0;
                        foreach (var value in values)
                        {
                            if (index >= byteArray.Length)
                            {
                                break;
                            }

                            if (!byte.TryParse(value, out var byteValue))
                            {
                                index++;
                                continue;
                            }

                            byteArray[index] = byteValue;
                            index++;
                        }

                        // Set the DMX channel values and delete the file.
                        OpenDmx.setDmxValues(byteArray);
                        File.Delete(filePath);

                        Thread.Sleep(100);
                    }
                    catch (Exception ex)
                    {
                        Console.WriteLine($"Reading from and applying queue failed: {ex.Message}");
                    }
                }
                while (true);
            });
            ReadQueueThread.IsBackground = true;
            ReadQueueThread.Start();

            Console.Read();
        }

        static byte[] CreateNewChannelByteArray()
        {
            var byteArray = new byte[512];
            for (var i = 0; i < 512; i++)
            {
                byteArray[i] = 0;
            }

            return byteArray;
        }
    }
}
