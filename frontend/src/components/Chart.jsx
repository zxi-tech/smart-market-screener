import React, { useEffect, useRef } from 'react';
import { createChart } from 'lightweight-charts';

export default function Chart({ data }) {
    const chartContainerRef = useRef();
    const chartRef = useRef();

    useEffect(() => {
        // Do not render chart if data is empty
        if (!data || data.length === 0) return;

        // Premium Dark Mode Theme
        const colors = {
            backgroundColor: 'transparent',
            textColor: '#94a3b8', // Tailwind slate-400
            gridColor: 'rgba(255, 255, 255, 0.04)',
            upColor: '#10b981', // emerald-500
            downColor: '#f43f5e', // rose-500
            volumeUp: 'rgba(16, 185, 129, 0.3)',
            volumeDown: 'rgba(244, 63, 94, 0.3)'
        };

        const chart = createChart(chartContainerRef.current, {
            layout: {
                background: { type: 'solid', color: colors.backgroundColor },
                textColor: colors.textColor,
                fontFamily: "'Inter', 'Segoe UI', system-ui, sans-serif",
            },
            grid: {
                vertLines: { color: colors.gridColor },
                horzLines: { color: colors.gridColor },
            },
            timeScale: {
                timeVisible: true,
                borderColor: 'rgba(255, 255, 255, 0.1)',
                rightOffset: 8,
                barSpacing: 10,
            },
            rightPriceScale: {
                borderColor: 'rgba(255, 255, 255, 0.1)',
                autoScale: true,
            },
            crosshair: {
                mode: 1, // Magnet crosshair (easier to hover)
                vertLine: {
                    color: 'rgba(148, 163, 184, 0.4)',
                    width: 1,
                    style: 3,
                    labelBackgroundColor: '#1e293b'
                },
                horzLine: {
                    color: 'rgba(148, 163, 184, 0.4)',
                    width: 1,
                    style: 3,
                    labelBackgroundColor: '#1e293b'
                }
            }
        });

        // Candlestick Configuration
        const candlestickSeries = chart.addCandlestickSeries({
            upColor: colors.upColor,
            downColor: colors.downColor,
            borderVisible: false,
            wickUpColor: colors.upColor,
            wickDownColor: colors.downColor,
        });

        // Volume Configuration
        const volumeSeries = chart.addHistogramSeries({
            priceFormat: { type: 'volume' },
            priceScaleId: '',
        });

        chart.priceScale('').applyOptions({
            scaleMargins: { top: 0.8, bottom: 0 },
        });

        const formattedData = data.map(item => ({
            time: item.Date,
            open: item.Open,
            high: item.High,
            low: item.Low,
            close: item.Close
        }));

        const volumeData = data.map(item => ({
            time: item.Date,
            value: item.Volume,
            color: item.Close > item.Open ? colors.volumeUp : colors.volumeDown
        }));

        candlestickSeries.setData(formattedData);
        volumeSeries.setData(volumeData);
        chart.timeScale().fitContent();

        // Auto Resize feature when window is resized
        const handleResize = () => {
            if (chartContainerRef.current) {
                chart.applyOptions({
                    width: chartContainerRef.current.clientWidth,
                    height: chartContainerRef.current.clientHeight
                });
            }
        };

        window.addEventListener('resize', handleResize);
        setTimeout(handleResize, 50); // Prevent initial flexbox glitch

        chartRef.current = chart;

        return () => {
            window.removeEventListener('resize', handleResize);
            chart.remove();
        };
    }, [data]);

    return (
        <div
            ref={chartContainerRef}
            className="w-full h-full absolute inset-0 rounded-lg overflow-hidden"
        />
    );
}